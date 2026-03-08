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

            let sourceViewDoc = null;
            if (payloadData.source_document_id && ["payment_payable", "payment_receivable"].includes(docType)) {
                const coll = docType === "payment_payable" ? "payable_views" : "receivable_views";
                sourceViewDoc = await transaction.get(db.collection(coll).doc(payloadData.source_document_id));
            }

            // Shard Settings
            const SHARD_COUNT = 10;
            const shardId = Math.floor(Math.random() * SHARD_COUNT);

            // Prefetch ALL shards for Trip Profit if closing or processing financial effects
            const tripProfitShards = [];
            if (tripId) {
                for (let i = 0; i < SHARD_COUNT; i++) {
                    tripProfitShards.push(transaction.get(db.collection("trip_profit_views").doc(`${tripId}__S${i}`)));
                }
            }
            const tripProfitSnaps = tripId ? await Promise.all(tripProfitShards) : [];
            const aggregateTripProfit = () => {
                let rev = 0, exp = 0, net = 0;
                tripProfitSnaps.forEach(s => {
                    if (s.exists) {
                        const d = s.data();
                        rev += (d.total_revenue || 0);
                        exp += (d.total_expenses || 0);
                        net += (d.net_profit || 0);
                    }
                });
                return { total_revenue: rev, total_expenses: exp, net_profit: net };
            };

            // Configuration System (Hierarchical Resolution)
            const configIds = ['default'];
            if (payloadData.location_id) configIds.push(`loc__${payloadData.location_id}`);
            if (payloadData.unit_id) configIds.push(`unit__${payloadData.unit_id}`);
            const skuIdsInLines = [...new Set(lines ? lines.map(l => l.sku_id).filter(Boolean) : [])];
            skuIdsInLines.forEach(cid => configIds.push(`sku__${cid}`));

            const configMap = new Map();
            for (const cid of configIds) {
                const snap = await transaction.get(db.collection("control_config").doc(cid));
                if (snap.exists) configMap.set(cid, snap.data());
            }

            const resolveThresholds = (skuId) => {
                const base = configMap.get('default') || { yield_variance_threshold: 0.1, transfer_delay_hours: 24, max_cost_basis: 1000000 };
                const loc = payloadData.location_id ? (configMap.get(`loc__${payloadData.location_id}`) || {}) : {};
                const unit = payloadData.unit_id ? (configMap.get(`unit__${payloadData.unit_id}`) || {}) : {};
                const sku = skuId ? (configMap.get(`sku__${skuId}`) || {}) : {};
                return { ...base, ...loc, ...unit, ...sku };
            };
            const config = resolveThresholds(); // Document-level default

            logger.info(`[DEBUG] Read phase complete. Wallets: ${wallets.size}, Invs: ${invs.size}, docType: ${docType}`);

            // 3b. Lineage Inheritance (Automatic)
            logger.info(`[TRACE] Inheriting lineage for ${expectedHmac}`, { sourceDocId: payloadData.source_document_id || payloadData.source_receiving_doc });
            let inheritedLineage = {};
            let sourceDocData = null;
            const sourceDocId = payloadData.source_document_id || payloadData.source_receiving_doc;
            if (sourceDocId) {
                const sourceDoc = await transaction.get(db.collection("documents").doc(sourceDocId));
                if (sourceDoc.exists) {
                    sourceDocData = sourceDoc.data();
                    const sLineage = sourceDocData.lineage || {};
                    inheritedLineage = {
                        trip_id: sourceDocData.trip_id || sLineage.trip_id,
                        batch_id: sourceDocData.batch_id || sLineage.batch_id,
                        origin_location_id: sourceDocData.origin_location_id || sourceDocData.location_id || sLineage.origin_location_id,
                        origin_unit_id: sourceDocData.origin_unit_id || sourceDocData.unit_id || sLineage.origin_unit_id,
                        source_receiving_doc: sourceDocData.source_receiving_doc || (sourceDocData.document_type === "hub_receive_from_boat" ? sourceDocId : sLineage.source_receiving_doc)
                    };
                }
            }
            const lineage = {
                trip_id: payloadData.trip_id || inheritedLineage.trip_id || null,
                batch_id: payloadData.batch_id || inheritedLineage.batch_id || null,
                origin_location_id: payloadData.origin_location_id || inheritedLineage.origin_location_id || null,
                origin_unit_id: payloadData.origin_unit_id || inheritedLineage.origin_unit_id || null,
                source_receiving_doc: payloadData.source_receiving_doc || inheritedLineage.source_receiving_doc || null
            };

            // 3c. Hub receive validation: verify source inventory is sufficient
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

                // Control 3: Transfer Aging
                if (sourceDocData && sourceDocData.server_timestamp) {
                    const ageHours = (Date.now() - sourceDocData.server_timestamp.toDate().getTime()) / (1000 * 60 * 60);
                    if (ageHours > config.transfer_delay_hours) {
                        transaction.set(db.collection("transfer_alerts").doc(expectedHmac), {
                            company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                            document_id: expectedHmac, source_document_id: sourceDocId, age_hours: Math.round(ageHours),
                            type: "TRANSFER_DELAYED", timestamp: FieldValue.serverTimestamp()
                        });
                    }

                    // HQ Analytics: Transfer Network (Inter-location)
                    const toLoc = payloadData.location_id;
                    const fromLoc = sourceDocData.location_id;
                    const netKey = `${payloadData.company_id}__${fromLoc}__${toLoc}`;
                    transaction.set(db.collection("transfer_network_views").doc(netKey), {
                        company_id: payloadData.company_id,
                        from_location: fromLoc,
                        to_location: toLoc,
                        transfer_count: FieldValue.increment(1),
                        total_age_hours: FieldValue.increment(ageHours),
                        last_updated: FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            }

            if (docType === "transfer_interlocation" && lines) {
                const toLoc = lines.find(l => l.event_type === "transfer_received")?.location_id;
                if (toLoc) {
                    const netKey = `${payloadData.company_id}__${payloadData.location_id}__${toLoc}`;
                    transaction.set(db.collection("transfer_network_views").doc(netKey), {
                        company_id: payloadData.company_id,
                        from_location: payloadData.location_id,
                        to_location: toLoc,
                        transfer_count: FieldValue.increment(1),
                        last_updated: FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            }

            // 4. TRANSFORMATION & COST ALLOCATION PRE-CALC
            let transValue = 0, transQty = 0, transOutQty = 0, wasteQty = 0, byproductQty = 0;
            let totalAllocatedCost = 0;

            if (lines) {
                for (const l of lines) {
                    if (l.event_type === "transformation_out") {
                        const sid = `${l.location_id}__${l.unit_id}__${l.sku_id}`;
                        const s = invs.get(sid);
                        if (s) transValue += l.amount * (s.avg_cost || 0);
                        transOutQty += l.amount;
                    } else if (l.event_type === "transformation_in") {
                        transQty += l.amount;
                        if (l.sku_id && l.sku_id.includes("waste")) wasteQty += l.amount;
                        else if (l.sku_id && (l.sku_id.includes("roe") || l.sku_id.includes("byproduct"))) byproductQty += l.amount;
                    } else if (l.event_type === "cost_allocation") {
                        totalAllocatedCost += l.amount;
                    }
                }
            }
            const transCost = transQty > 0 ? (transValue / transQty) : 0;
            const yieldRatio = transOutQty > 0 ? (transQty / transOutQty) : 0;

            // 5. WRITE PHASE — Immutable document
            transaction.set(db.collection("documents").doc(expectedHmac), {
                ...payloadData,
                lineage,
                lines: lines || [],
                status: "posted",
                server_timestamp: FieldValue.serverTimestamp()
            });

            // 5b. Create Processing Batch record
            if (docType === "inventory_transformation") {
                const bId = lineage.batch_id || payloadData.batch_id || expectedHmac;
                transaction.set(db.collection("processing_batches").doc(expectedHmac), {
                    batch_id: bId, document_id: expectedHmac, lineage,
                    operator_id: payloadData.operator_id || "SYSTEM",
                    factory_unit_id: payloadData.factory_unit_id || payloadData.unit_id,
                    company_id: payloadData.company_id, location_id: payloadData.location_id,
                    unit_id: payloadData.factory_unit_id || payloadData.unit_id,
                    input_qty: transOutQty, output_qty: transQty,
                    waste_qty: wasteQty, byproduct_qty: byproductQty,
                    yield_ratio: Math.round(yieldRatio * 10000) / 10000,
                    waste_ratio: transOutQty > 0 ? Math.round((wasteQty / transOutQty) * 10000) / 10000 : 0,
                    status: "posted", server_timestamp: FieldValue.serverTimestamp()
                });

                // Control 1: Yield Variance Alerts
                const expectedYield = payloadData.expected_yield_ratio || 0.8;
                const variance = Math.abs(yieldRatio - expectedYield);
                if (variance > config.yield_variance_threshold) {
                    transaction.set(db.collection("yield_alerts").doc(expectedHmac), {
                        company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                        batch_id: bId, expected_ratio: expectedYield, actual_ratio: yieldRatio,
                        variance: Math.round(variance * 10000) / 10000,
                        severity: variance > (config.yield_variance_threshold * 3) ? "CRITICAL" : "WARNING",
                        timestamp: FieldValue.serverTimestamp()
                    });
                }

                // HQ Analytics: Factory Performance (SHARDED)
                const facPerfId = `${payloadData.company_id}__${payloadData.unit_id}__S${shardId}`;
                transaction.set(db.collection("factory_performance_views").doc(facPerfId), {
                    company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                    total_input_qty: FieldValue.increment(transOutQty),
                    total_output_qty: FieldValue.increment(transQty),
                    waste_qty: FieldValue.increment(wasteQty),
                    byproduct_qty: FieldValue.increment(byproductQty),
                    processing_volume: FieldValue.increment(1),
                    last_updated: FieldValue.serverTimestamp()
                }, { merge: true });
            }

            // 5c. SETTLEMENT & VIEW PROJECTIONS
            if (docType === "transfer_interlocation" && lines) {
                const toLoc = lines.find(l => l.event_type === "transfer_received")?.location_id;
                transaction.set(db.collection("transfer_views").doc(expectedHmac), {
                    document_id: expectedHmac, company_id: payloadData.company_id,
                    location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                    from_location: payloadData.location_id, to_location: toLoc || null,
                    status: "in_transit", lineage,
                    initiated_at: FieldValue.serverTimestamp(),
                    last_updated: FieldValue.serverTimestamp()
                });
            }

            // AP/AR Logic
            if (payloadData.supplier_id && payloadData.is_credit) {
                const purchaseAmount = lines.reduce((acc, l) => acc + (l.amount * (l.unit_cost || 0)), 0);
                transaction.set(db.collection("payable_views").doc(expectedHmac), {
                    document_id: expectedHmac, company_id: payloadData.company_id,
                    location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                    supplier_id: payloadData.supplier_id, amount: purchaseAmount,
                    due_date: payloadData.due_date || null,
                    status: "pending", server_timestamp: FieldValue.serverTimestamp()
                });

                if (payloadData.due_date && new Date(payloadData.due_date) < new Date()) {
                    transaction.set(db.collection("payable_alerts").doc(expectedHmac), {
                        company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                        document_id: expectedHmac, type: "OVERDUE_AT_CREATION", timestamp: FieldValue.serverTimestamp()
                    });
                }
            }
            if (payloadData.customer_id && payloadData.is_credit) {
                const saleAmount = lines.reduce((acc, l) => acc + (l.amount * (l.unit_price || 0)), 0);
                transaction.set(db.collection("receivable_views").doc(expectedHmac), {
                    document_id: expectedHmac, company_id: payloadData.company_id,
                    location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                    customer_id: payloadData.customer_id, amount: saleAmount,
                    due_date: payloadData.due_date || null,
                    status: "pending", server_timestamp: FieldValue.serverTimestamp()
                });

                if (payloadData.due_date && new Date(payloadData.due_date) < new Date()) {
                    transaction.set(db.collection("receivable_alerts").doc(expectedHmac), {
                        company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                        document_id: expectedHmac, type: "OVERDUE_AT_CREATION", timestamp: FieldValue.serverTimestamp()
                    });
                }
            }

            // Payment reconciliation with amount validation
            if (docType === "payment_payable" && payloadData.source_document_id) {
                if (!sourceViewDoc?.exists) throw new Error("PAYABLE_NOT_FOUND");
                const pData = sourceViewDoc.data();
                const outstanding = pData.amount;
                const payment = lines.reduce((acc, l) => acc + (l.payment_amount || l.amount || 0), 0);
                if (payment !== outstanding) throw new Error(`PAYMENT_MISMATCH: Outstanding payable is ${outstanding}, attempting to pay ${payment}`);
                transaction.set(db.collection("payable_views").doc(payloadData.source_document_id), { status: "settled", payment_doc: expectedHmac }, { merge: true });

                if (pData.due_date && new Date(pData.due_date) < new Date()) {
                    transaction.set(db.collection("payable_alerts").doc(expectedHmac), {
                        company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                        document_id: payloadData.source_document_id, type: "LATE_PAYMENT", timestamp: FieldValue.serverTimestamp()
                    });
                }
            }
            if (docType === "payment_receivable" && payloadData.source_document_id) {
                if (!sourceViewDoc?.exists) throw new Error("RECEIVABLE_NOT_FOUND");
                const rData = sourceViewDoc.data();
                const outstanding = rData.amount;
                const payment = lines.reduce((acc, l) => acc + (l.payment_amount || l.amount || 0), 0);
                if (payment !== outstanding) throw new Error(`PAYMENT_MISMATCH: Outstanding receivable is ${outstanding}, attempting to collect ${payment}`);
                transaction.set(db.collection("receivable_views").doc(payloadData.source_document_id), { status: "settled", payment_doc: expectedHmac }, { merge: true });

                if (rData.due_date && new Date(rData.due_date) < new Date()) {
                    transaction.set(db.collection("receivable_alerts").doc(expectedHmac), {
                        company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                        document_id: payloadData.source_document_id, type: "LATE_COLLECTION", timestamp: FieldValue.serverTimestamp()
                    });
                }
            }

            // 6. Generate Wallet & Inventory Events
            let revenueDelta = 0, expenseDelta = 0;
            if (lines) {
                lines.forEach((line, i) => {
                    const baseId = `${expectedHmac}_L${i}`;
                    if (line.wallet_id) {
                        const w = wallets.get(line.wallet_id);
                        if (!w) {
                            logger.error(`[CRITICAL] Wallet not found in pre-fetched map: ${line.wallet_id}. Pre-fetched keys: ${Array.from(wallets.keys())}`);
                            throw new Error(`WALLET_NOT_FOUND_IN_TRANSACTION: ${line.wallet_id}`);
                        }
                        w.sequence_number += 1;
                        let delta = 0;
                        const et = line.payment_event_type || line.event_type;
                        if (["deposit", "transfer_received", "revenue_cash", "payment_received"].includes(et)) {
                            delta = line.payment_amount || line.amount || 0;
                            revenueDelta += delta;
                        } else if (["expense", "expense_trip", "expense_purchase", "transfer_initiated", "payment_made"].includes(et)) {
                            delta = -(line.payment_amount || line.amount || 0);
                            expenseDelta += Math.abs(delta);
                        }
                        if (line.wallet_type === "hub" && w.current_balance + delta < 0) throw new Error("OVERDRAFT_BLOCKED: Hub wallets cannot fall below zero.");
                        w.current_balance += delta;
                        transaction.set(db.collection("wallet_events").doc(`${baseId}_W`), { ...line, parent_document_id: expectedHmac, sequence_number: w.sequence_number, server_timestamp: FieldValue.serverTimestamp() });
                    }

                    if (line.sku_id && line.location_id && line.unit_id) {
                        const sid = `${line.location_id}__${line.unit_id}__${line.sku_id}`;
                        const s = invs.get(sid);
                        if (!s) {
                            logger.warn(`[WARN] Inventory scope not pre-fetched: ${sid}`);
                            return;
                        }
                        s.sequence_number += 1;
                        let delta = 0, cost = line.unit_cost || 0;

                        if (["receive_own", "receive_buy", "transfer_received", "transfer_cancelled"].includes(line.event_type)) {
                            delta = line.amount;
                            if (delta > 0) {
                                const oldV = s.current_balance * (s.avg_cost || 0);
                                const newV = delta * cost;
                                s.avg_cost = (oldV + newV) / (s.current_balance + delta);
                            }
                        } else if (line.event_type === "transformation_in") {
                            delta = line.amount; cost = transCost;
                            if (delta > 0) {
                                const oldV = s.current_balance * (s.avg_cost || 0);
                                const newV = delta * cost;
                                s.avg_cost = (oldV + newV) / (s.current_balance + delta);
                            }
                        } else if (line.event_type === "cost_allocation") {
                            if (s.current_balance > 0) {
                                s.avg_cost += (line.amount / s.current_balance);
                            }
                        } else if (["sale_out", "waste_out", "transformation_out", "transfer_initiated"].includes(line.event_type)) {
                            delta = -line.amount; cost = s.avg_cost || 0;
                        }

                        if (s.current_balance + delta < 0) throw new Error(`STOCK_DEFICIT: ${line.sku_id}`);
                        s.current_balance += delta;
                        if (s.current_balance === 0) s.avg_cost = 0;

                        transaction.set(db.collection("inventory_events").doc(`${baseId}_I`), {
                            ...line, lineage: { ...lineage, ...(line.lineage || {}) },
                            unit_cost: cost,
                            parent_document_id: expectedHmac,
                            sequence_number: s.sequence_number,
                            server_timestamp: FieldValue.serverTimestamp()
                        });
                    }
                });
            }

            // Atomic increment of trip profit (SHARDED)
            if (tripId && (revenueDelta !== 0 || expenseDelta !== 0)) {
                transaction.set(db.collection("trip_profit_views").doc(`${tripId}__S${shardId}`), {
                    company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                    total_revenue: FieldValue.increment(revenueDelta),
                    total_expenses: FieldValue.increment(expenseDelta),
                    net_profit: FieldValue.increment(revenueDelta - expenseDelta),
                    last_updated: FieldValue.serverTimestamp()
                }, { merge: true });
            }

            // 7. Write back all final states
            wallets.forEach((v, k) => transaction.set(db.collection("wallet_states").doc(k), { ...v, last_updated: FieldValue.serverTimestamp() }, { merge: true }));
            invs.forEach((v, k) => {
                const [locId, unitId, skuId] = k.split("__");
                const roundedCost = Math.round((v.avg_cost || 0) * 100) / 100;

                // Pure state projection (Ledger)
                transaction.set(db.collection("inventory_states").doc(k), {
                    ...v,
                    location_id: locId, unit_id: unitId, sku_id: skuId,
                    avg_cost: roundedCost,
                    last_updated: FieldValue.serverTimestamp()
                }, { merge: true });

                // Read model projection (Stock View)
                transaction.set(db.collection("stock_views").doc(k), {
                    company_id: payloadData.company_id,
                    location_id: locId, unit_id: unitId, sku_id: skuId,
                    qty: v.current_balance, avg_cost: roundedCost,
                    last_updated: FieldValue.serverTimestamp()
                });

                // Control 2: Inventory Anomalies
                if (v.current_balance < 0) {
                    transaction.set(db.collection("inventory_anomalies").doc(`${k}__NEG`), {
                        company_id: payloadData.company_id, location_id: locId, unit_id: unitId, sku_id: skuId,
                        balance: v.current_balance, type: "NEGATIVE_BALANCE",
                        timestamp: FieldValue.serverTimestamp()
                    });
                }

                // Control 6: Cost Integrity
                const skuConfig = resolveThresholds(skuId);
                if (roundedCost > skuConfig.max_cost_basis) {
                    transaction.set(db.collection("cost_anomalies").doc(`${k}__COST`), {
                        company_id: payloadData.company_id, location_id: locId, unit_id: unitId, sku_id: skuId,
                        avg_cost: roundedCost, type: "HIGH_COST_BASIS",
                        timestamp: FieldValue.serverTimestamp()
                    });
                }

                // HQ Analytics: Inventory Heatmap
                transaction.set(db.collection("inventory_heatmap_views").doc(k), {
                    company_id: payloadData.company_id, location_id: locId, unit_id: unitId, sku_id: skuId,
                    qty: v.current_balance, avg_cost: roundedCost,
                    last_updated: FieldValue.serverTimestamp()
                });

                // Batch-specific Stock View for HQ
                if (lineage.batch_id && v.current_balance > 0) {
                    const bk = `${k}__${lineage.batch_id}`;
                    transaction.set(db.collection("stock_batch_views").doc(bk), {
                        company_id: payloadData.company_id,
                        location_id: locId, unit_id: unitId, sku_id: skuId,
                        batch_id: lineage.batch_id,
                        qty: v.current_balance,
                        lineage,
                        last_updated: FieldValue.serverTimestamp()
                    });
                }
            });

            // 8. Lock Trip if closure
            if (docType === "trip_closure" && tripId) {
                transaction.set(db.collection("trip_states").doc(tripId), { status: "closed", closed_at: FieldValue.serverTimestamp(), closed_by_doc: expectedHmac }, { merge: true });
                // Financial Settlement Record (from Aggregated Shards)
                const finalProfit = aggregateTripProfit();

                // HQ Analytics: Boat Profitability (SHARDED)
                const boatKey = `${payloadData.company_id}__${payloadData.unit_id}__S${shardId}`;
                transaction.set(db.collection("boat_profit_views").doc(boatKey), {
                    company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                    total_revenue: FieldValue.increment(finalProfit.total_revenue || 0),
                    total_expenses: FieldValue.increment(finalProfit.total_expenses || 0),
                    total_profit: FieldValue.increment(finalProfit.net_profit || 0),
                    trip_count: FieldValue.increment(1),
                    last_updated: FieldValue.serverTimestamp()
                }, { merge: true });

                // Control 5: Trip Settlement Verification
                if (Math.abs(finalProfit.total_revenue - finalProfit.total_expenses - finalProfit.net_profit) > 1) {
                    transaction.set(db.collection("trip_anomalies").doc(tripId), {
                        company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                        trip_id: tripId, revenue: finalProfit.total_revenue, expenses: finalProfit.total_expenses, profit: finalProfit.net_profit,
                        type: "P&L_MISMATCH", timestamp: FieldValue.serverTimestamp()
                    });
                }

                transaction.set(db.collection("settlement_views").doc(tripId), {
                    trip_id: tripId, company_id: payloadData.company_id, location_id: payloadData.location_id, unit_id: payloadData.unit_id,
                    ...finalProfit, status: "settled", server_timestamp: FieldValue.serverTimestamp()
                });
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
