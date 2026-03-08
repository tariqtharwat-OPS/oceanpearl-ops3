const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const crypto = require("crypto");
const logger = require("firebase-functions/logger");

/**
 * OPS V3 - Document Processor Trigger (V2 HARDENED)
 */
exports.validateDocumentRequest = onDocumentCreated({
    document: "document_requests/{requestId}",
    region: "asia-southeast1"
}, async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    if (!data) return;
    logger.info(`[DEBUG] Processing document_request: ${event.params.requestId}`, { type: data.document_type });

    const db = admin.firestore();
    const HMAC_SECRET = process.env.HMAC_SECRET || "OPS3_PHASE0_DEV_SECRET";
    const { idempotency_key, nonce, lines, ...payloadData } = data;

    // 1. HMAC Validation
    const payloadString = JSON.stringify({ ...payloadData, lines });
    const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');
    const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET)
        .update(payloadHash + (nonce || ""))
        .digest('hex');

    if (idempotency_key !== expectedHmac) {
        console.error(`SECURITY_VIOLATION: HMAC mismatch for ${event.params.requestId}`);
        await snap.ref.delete();
        return;
    }

    const lockRef = db.collection("idempotency_locks").doc(expectedHmac);

    // 2. Idempotency Check
    const isProcessed = await db.runTransaction(async (t) => {
        const doc = await t.get(lockRef);
        if (doc.exists && doc.data().status === "COMPLETED") return true;
        t.set(lockRef, { status: "RUNNING", timestamp: Date.now() });
        return false;
    });

    if (isProcessed) {
        await snap.ref.delete();
        return;
    }

    try {
        await db.runTransaction(async (transaction) => {
            // 3. READ PHASE
            const walletIds = [...new Set(lines ? lines.map(l => l.wallet_id).filter(Boolean) : [])];
            const inventoryScopes = [...new Set(lines ? lines.map(l => l.sku_id && l.location_id && l.unit_id ? `${l.location_id}__${l.unit_id}__${l.sku_id}` : null).filter(Boolean) : [])];

            const tripId = payloadData.trip_id;
            const docType = payloadData.document_type;

            // 3a. Trip state validation (context-aware)
            if (tripId) {
                const ts = await transaction.get(db.collection("trip_states").doc(tripId));
                const tripStatus = ts.exists ? ts.data().status : null;

                if (docType === "hub_receive_from_boat") {
                    // Hub receiving REQUIRES the trip to be closed
                    if (tripStatus !== "closed") {
                        throw new Error("TRIP_NOT_CLOSED: Hub receive requires a closed boat trip.");
                    }
                } else {
                    // All other document types reject closed trips
                    if (tripStatus === "closed") {
                        throw new Error("TRIP_CLOSED: Cannot modify a closed trip.");
                    }
                }
            }

            const wallets = new Map();
            for (const wid of walletIds) {
                const s = await transaction.get(db.collection("wallet_states").doc(wid));
                wallets.set(wid, s.exists ? s.data() : { current_balance: 0, sequence_number: 0 });
            }

            const invs = new Map();
            for (const sid of inventoryScopes) {
                const s = await transaction.get(db.collection("inventory_states").doc(sid));
                invs.set(sid, s.exists ? s.data() : { current_balance: 0, avg_cost: 0, sequence_number: 0 });
            }
            logger.info(`[DEBUG] Read phase complete. Wallets: ${wallets.size}, Invs: ${invs.size}, docType: ${docType}`);

            // 3b. Hub receive validation: verify source inventory is sufficient
            if (docType === "hub_receive_from_boat" && lines) {
                for (const l of lines) {
                    if (l.event_type === "transfer_initiated") {
                        const sid = `${l.location_id}__${l.unit_id}__${l.sku_id}`;
                        const s = invs.get(sid);
                        if (!s || s.current_balance < l.amount) {
                            throw new Error(`HUB_RECEIVE_OVERCOUNT: SKU ${l.sku_id} — requested ${l.amount}, boat has ${s ? s.current_balance : 0}`);
                        }
                    }
                }
            }

            // 4. TRANSFORMATION PRE-CALC
            let transValue = 0;
            let transQty = 0;
            let transOutQty = 0;
            if (lines) {
                for (const l of lines) {
                    if (l.event_type === "transformation_out") {
                        const sid = `${l.location_id}__${l.unit_id}__${l.sku_id}`;
                        const s = invs.get(sid);
                        if (s) transValue += l.amount * (s.avg_cost || 0);
                        transOutQty += l.amount;
                    } else if (l.event_type === "transformation_in") {
                        transQty += l.amount;
                    }
                }
            }
            const transCost = transQty > 0 ? (transValue / transQty) : 0;
            const yieldRatio = transOutQty > 0 ? (transQty / transOutQty) : 0;

            // 5. WRITE PHASE — Immutable document
            transaction.set(db.collection("documents").doc(expectedHmac), {
                ...payloadData,
                lines: lines || [],
                status: "posted",
                server_timestamp: FieldValue.serverTimestamp()
            });

            // 5b. Create Processing Batch record if transformation
            if (docType === "inventory_transformation") {
                const batchId = payloadData.batch_id || payloadData.document_id;
                if (batchId) {
                    transaction.set(db.collection("processing_batches").doc(expectedHmac), {
                        batch_id: batchId,
                        document_id: expectedHmac,
                        operator_id: payloadData.operator_id || "SYSTEM",
                        factory_unit_id: payloadData.factory_unit_id || payloadData.unit_id,
                        company_id: payloadData.company_id,
                        location_id: payloadData.location_id,
                        unit_id: payloadData.factory_unit_id || payloadData.unit_id,
                        source_receiving_doc: payloadData.source_receiving_doc || null,
                        input_qty: transOutQty,
                        output_qty: transQty,
                        yield_ratio: Math.round(yieldRatio * 10000) / 10000,
                        status: "posted",
                        server_timestamp: FieldValue.serverTimestamp()
                    });
                }
            }

            // 6. Generate Wallet & Inventory Events
            if (lines) {
                lines.forEach((line, i) => {
                    const baseId = `${expectedHmac}_L${i}`;

                    if (line.wallet_id) {
                        const w = wallets.get(line.wallet_id);
                        w.sequence_number += 1;
                        let delta = 0;
                        const et = line.payment_event_type || line.event_type;
                        if (["deposit", "transfer_received", "deposit_cash_handover", "revenue_cash"].includes(et)) delta = line.amount || line.payment_amount;
                        else if (["expense", "expense_trip", "expense_purchase", "transfer_initiated"].includes(et)) delta = -(line.amount || line.payment_amount);

                        if (line.wallet_type === "hub" && w.current_balance + delta < 0) {
                            throw new Error("OVERDRAFT_BLOCKED: Hub wallets cannot fall below zero.");
                        }

                        w.current_balance += delta;
                        transaction.set(db.collection("wallet_events").doc(`${baseId}_W`), {
                            ...line,
                            parent_document_id: expectedHmac,
                            sequence_number: w.sequence_number,
                            server_timestamp: FieldValue.serverTimestamp()
                        });
                    }

                    if (line.sku_id) {
                        const sid = `${line.location_id}__${line.unit_id}__${line.sku_id}`;
                        const s = invs.get(sid);
                        s.sequence_number += 1;
                        let delta = 0;
                        let cost = line.unit_cost || 0;

                        if (["receive_own", "receive_buy", "transfer_received", "transfer_cancelled"].includes(line.event_type)) {
                            delta = line.amount;
                            if (delta > 0) {
                                const oldV = s.current_balance * (s.avg_cost || 0);
                                const newV = delta * cost;
                                s.avg_cost = (oldV + newV) / (s.current_balance + delta);
                            }
                        } else if (line.event_type === "transformation_in") {
                            delta = line.amount;
                            cost = transCost;
                            if (delta > 0) {
                                const oldV = s.current_balance * (s.avg_cost || 0);
                                const newV = delta * cost;
                                s.avg_cost = (oldV + newV) / (s.current_balance + delta);
                            }
                        } else if (["sale_out", "waste_out", "transformation_out", "transfer_initiated"].includes(line.event_type)) {
                            delta = -line.amount;
                            cost = s.avg_cost || 0;
                        }

                        if (s.current_balance + delta < 0) throw new Error(`STOCK_DEFICIT: ${line.sku_id}`);
                        s.current_balance += delta;
                        if (s.current_balance === 0) s.avg_cost = 0;

                        transaction.set(db.collection("inventory_events").doc(`${baseId}_I`), {
                            ...line,
                            unit_cost: cost,
                            parent_document_id: expectedHmac,
                            sequence_number: s.sequence_number,
                            server_timestamp: FieldValue.serverTimestamp()
                        });
                    }
                });
            }

            // 7. Write back all final states
            wallets.forEach((v, k) => transaction.set(db.collection("wallet_states").doc(k), { ...v, last_updated: FieldValue.serverTimestamp() }, { merge: true }));
            invs.forEach((v, k) => {
                const [locId, unitId, skuId] = k.split("__");
                const roundedCost = Math.round((v.avg_cost || 0) * 100) / 100;

                // Pure state projection (Ledger)
                transaction.set(db.collection("inventory_states").doc(k), {
                    ...v,
                    location_id: locId,
                    unit_id: unitId,
                    sku_id: skuId,
                    avg_cost: roundedCost,
                    last_updated: FieldValue.serverTimestamp()
                }, { merge: true });

                // Read model projection (Stock View)
                transaction.set(db.collection("stock_views").doc(k), {
                    company_id: payloadData.company_id,
                    location_id: locId,
                    unit_id: unitId,
                    sku_id: skuId,
                    qty: v.current_balance,
                    avg_cost: roundedCost,
                    last_updated: FieldValue.serverTimestamp()
                });
            });

            // 8. Lock Trip if closure
            if (docType === "trip_closure" && tripId) {
                transaction.set(db.collection("trip_states").doc(tripId), {
                    status: "closed",
                    closed_at: FieldValue.serverTimestamp(),
                    closed_by_doc: expectedHmac
                }, { merge: true });
            }
        });

        await lockRef.update({ status: "COMPLETED", timestamp: Date.now() });
        await snap.ref.delete();
    } catch (err) {
        console.error(`ERROR: ${err.message}`);
        await lockRef.update({ status: "FAILED", error: err.message, timestamp: Date.now() });
        throw err;
    }
});
