import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

export const validateDocumentRequest = functions.firestore
    .document("document_requests/{requestId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const requestId = context.params.requestId;

        if (!data) return;

        const HMAC_SECRET = process.env.HMAC_SECRET || "OPS3_PHASE0_DEV_SECRET";

        // 1. Validate payload integrity
        const { idempotency_key, nonce, lines, ...payloadData } = data;

        // Reconstruct the exact stringified object hash
        // We know we sent the whole payload, so:
        const payloadString = JSON.stringify({ ...payloadData, lines });
        const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

        const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET)
            .update(payloadHash + (nonce || ""))
            .digest('hex');

        if (idempotency_key !== expectedHmac) {
            console.error(`HMAC validation failed on document_request. Replay attack or payload tampering detected.`);
            await snap.ref.delete();
            throw new Error(`Invalid HMAC sequence.`);
        }

        const db = admin.firestore();
        const lockRef = db.collection("idempotency_locks").doc(expectedHmac);

        // 2. Idempotency Lock
        await db.runTransaction(async (lockTx) => {
            const lockDoc = await lockTx.get(lockRef);
            if (lockDoc.exists) {
                const lockData = lockDoc.data()!;
                if (lockData.status === "COMPLETED") {
                    throw new Error("IDEMPOTENCY_REJECT: Document already processed.");
                }
                if (lockData.status === "RUNNING") {
                    const elapsed = Date.now() - lockData.timestamp;
                    if (elapsed < 60000) {
                        throw new Error("IDEMPOTENCY_REJECT: Document currently running.");
                    }
                }
            }
            lockTx.set(lockRef, { status: "RUNNING", timestamp: Date.now() });
        });

        try {
            await db.runTransaction(async (transaction) => {
                // 3a. Pre-fetch all referenced wallets AND inventory scopes to avoid read-after-write errors
                const walletIds = [...new Set(lines ? lines.map((l: any) => l.wallet_id).filter(Boolean) : [])] as string[];
                const inventoryScopes = [...new Set(lines ? lines.map((l: any) => l.sku_id && l.location_id && l.unit_id ? `${l.location_id}__${l.unit_id}__${l.sku_id}` : null).filter(Boolean) : [])] as string[];

                const walletStateDocs = new Map<string, admin.firestore.DocumentSnapshot>();
                const inventoryStateDocs = new Map<string, admin.firestore.DocumentSnapshot>();

                for (const wid of walletIds) {
                    const walletStateRef = db.collection("wallet_states").doc(wid);
                    const doc = await transaction.get(walletStateRef);
                    if (doc.exists) walletStateDocs.set(wid, doc);
                }
                for (const scopeId of inventoryScopes) {
                    const inventoryStateRef = db.collection("inventory_states").doc(scopeId);
                    const doc = await transaction.get(inventoryStateRef);
                    if (doc.exists) inventoryStateDocs.set(scopeId, doc);
                }

                // 3b. Keep mutable state in memory
                const activeWallets = new Map<string, { currentBalance: number, sequenceNumber: number }>();
                for (const wid of walletIds) {
                    const doc = walletStateDocs.get(wid);
                    activeWallets.set(wid, {
                        currentBalance: doc?.data()?.current_balance || 0,
                        sequenceNumber: doc?.data()?.sequence_number || 0
                    });
                }
                const activeInventory = new Map<string, { currentBalance: number, sequenceNumber: number }>();
                for (const scopeId of inventoryScopes) {
                    const doc = inventoryStateDocs.get(scopeId);
                    activeInventory.set(scopeId, {
                        currentBalance: doc?.data()?.current_balance || 0,
                        sequenceNumber: doc?.data()?.sequence_number || 0
                    });
                }

                // 3c. Document Creation (Immutable)
                const docRef = db.collection("documents").doc(expectedHmac);
                transaction.set(docRef, {
                    ...payloadData,
                    lines: lines || [],
                    idempotency_key,
                    nonce,
                    status: "posted",
                    server_timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

                // 4. Generate Wallet & Inventory Events
                if (lines && Array.isArray(lines)) {
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        const eventBaseId = `${expectedHmac}_L${i}`;

                        // Wallet Event
                        if (line.wallet_id && line.payment_amount && line.payment_event_type) {
                            const walletState = activeWallets.get(line.wallet_id)!;
                            walletState.sequenceNumber += 1;

                            let delta = 0;
                            const evtType = line.payment_event_type;
                            if (["deposit", "transfer_received", "deposit_cash_handover", "revenue_cash"].includes(evtType)) {
                                delta = line.payment_amount;
                            } else if (["expense", "expense_advance", "expense_trip", "expense_purchase", "transfer_initiated"].includes(evtType)) {
                                delta = -line.payment_amount;
                            }

                            if (line.wallet_type === "hub" && walletState.currentBalance + delta < 0) {
                                throw new Error("OVERDRAFT_BLOCKED: Hub wallets cannot fall below zero.");
                            }

                            walletState.currentBalance += delta;
                            const eventRef = db.collection("wallet_events").doc(eventBaseId + "_W");
                            transaction.set(eventRef, {
                                ...line,
                                amount: line.payment_amount,
                                event_type: line.payment_event_type,
                                parent_document_id: expectedHmac,
                                sequence_number: walletState.sequenceNumber,
                                server_timestamp: admin.firestore.FieldValue.serverTimestamp()
                            });
                        }

                        // Inventory Event
                        if (line.sku_id && line.amount && line.event_type) {
                            const scopeId = `${line.location_id}__${line.unit_id}__${line.sku_id}`;
                            const invState = activeInventory.get(scopeId)!;
                            invState.sequenceNumber += 1;

                            let delta = 0;
                            if (["receive_own", "receive_buy", "transfer_received", "transfer_cancelled"].includes(line.event_type)) {
                                delta = line.amount;
                            } else if (["transfer_initiated", "sale_out", "waste_out"].includes(line.event_type)) {
                                delta = -line.amount;
                            }

                            if (invState.currentBalance + delta < 0) {
                                throw new Error("STOCK_DEFICIT: Cannot drop below zero.");
                            }

                            invState.currentBalance += delta;
                            const eventRef = db.collection("inventory_events").doc(eventBaseId + "_I");
                            transaction.set(eventRef, {
                                ...line,
                                parent_document_id: expectedHmac,
                                sequence_number: invState.sequenceNumber,
                                server_timestamp: admin.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }
                }

                // 5. Write back all final states
                for (const [wid, state] of activeWallets.entries()) {
                    const walletStateRef = db.collection("wallet_states").doc(wid);
                    transaction.set(walletStateRef, {
                        wallet_id: wid,
                        sequence_number: state.sequenceNumber,
                        current_balance: state.currentBalance,
                        last_updated: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                for (const [scopeId, state] of activeInventory.entries()) {
                    const inventoryStateRef = db.collection("inventory_states").doc(scopeId);
                    const [locId, unitId, skuId] = scopeId.split("__");
                    transaction.set(inventoryStateRef, {
                        location_id: locId,
                        unit_id: unitId,
                        sku_id: skuId,
                        sequence_number: state.sequenceNumber,
                        current_balance: state.currentBalance,
                        last_updated: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }

            });

            // 5. Complete lock and remove request
            await lockRef.update({ status: "COMPLETED", timestamp: Date.now() });
            await snap.ref.delete();

        } catch (error: any) {
            if (error.message.includes("OVERDRAFT_BLOCKED")) {
                await lockRef.update({ status: "FAILED", error: error.message, timestamp: Date.now() });
                await snap.ref.delete();
            } else {
                await lockRef.update({ status: "FAILED", error: error.message, timestamp: Date.now() });
            }
            throw error;
        }
    });
