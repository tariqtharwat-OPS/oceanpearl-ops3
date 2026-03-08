/**
 * OPS3 — AUDIT FIX: Full Projection Recovery 
 * Rebuilds all read-models from the immutable event ledger + document journal.
 */

const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp({ projectId: "oceanpearl-ops" });
const db = admin.firestore();

async function rebuild() {
    console.log("══════════════════════════════════════════════════════════════");
    console.log("  OPS3 — Projection Recovery Tool (AUDIT COMPLIANT)");
    console.log("══════════════════════════════════════════════════════════════\n");

    const collectionsToClear = [
        "stock_views", "stock_batch_views", "factory_performance_views",
        "boat_profit_views", "trip_profit_views", "settlement_views",
        "transfer_views", "payable_views", "receivable_views"
    ];

    console.log("  1. Wiping existing projections...");
    for (const coll of collectionsToClear) {
        let snap = await db.collection(coll).get();
        while (snap.size > 0) {
            const batch = db.batch();
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            snap = await db.collection(coll).limit(500).get();
        }
        console.log(`    - Cleared ${coll}`);
    }

    console.log("\n  2. Rebuilding Inventory Projections (Stock & Batch)...");
    const invEvents = await db.collection("inventory_events").orderBy("server_timestamp", "asc").get();
    const stockMap = new Map();
    const batchStockMap = new Map();

    for (const doc of invEvents.docs) {
        const data = doc.data();
        const key = `${data.location_id}__${data.unit_id}__${data.sku_id}`;
        if (!stockMap.has(key)) stockMap.set(key, { qty: 0, cost: 0, company_id: data.company_id });

        const s = stockMap.get(key);
        const amount = data.amount;
        const et = data.event_type;

        // FIX 7: Event coverage including transfer_cancelled
        if (["receive_own", "receive_buy", "transfer_received", "transformation_in", "transfer_cancelled"].includes(et)) {
            const oldTotal = s.qty * s.cost;
            const newTotal = amount * (data.unit_cost || 0);
            s.cost = (s.qty + amount) > 0 ? (oldTotal + newTotal) / (s.qty + amount) : 0;
            s.qty += amount;
        } else if (["sale_out", "waste_out", "transformation_out", "transfer_initiated"].includes(et)) {
            s.qty -= amount;
        } else if (et === "cost_allocation") {
            if (s.qty > 0) s.cost += (amount / s.qty);
        }
        if (s.qty === 0) s.cost = 0;

        // Batch projections
        if (data.lineage && data.lineage.batch_id) {
            const bKey = `${key}__${data.lineage.batch_id}`;
            if (!batchStockMap.has(bKey)) batchStockMap.set(bKey, { qty: 0, lineage: data.lineage, company_id: data.company_id });
            const bs = batchStockMap.get(bKey);
            if (["receive_own", "receive_buy", "transfer_received", "transformation_in", "transfer_cancelled"].includes(et)) {
                bs.qty += amount;
            } else if (["sale_out", "waste_out", "transformation_out", "transfer_initiated"].includes(et)) {
                bs.qty -= amount;
            }
        }
    }

    const batch = db.batch();
    for (const [k, v] of stockMap.entries()) {
        const [loc, unit, sku] = k.split("__");
        await db.collection("stock_views").doc(k).set({
            company_id: v.company_id, location_id: loc, unit_id: unit, sku_id: sku,
            qty: v.qty, avg_cost: Math.round(v.cost * 100) / 100,
            last_updated: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    for (const [k, v] of batchStockMap.entries()) {
        if (v.qty <= 0) continue;
        const [loc, unit, sku] = k.split("__");
        await db.collection("stock_batch_views").doc(k).set({
            company_id: v.company_id, location_id: loc, unit_id: unit, sku_id: sku,
            batch_id: v.lineage.batch_id, qty: v.qty, lineage: v.lineage,
            last_updated: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    console.log("\n  3. Rebuilding Financial Projections (Trips, Shards, Settlement)...");
    const walletEvents = await db.collection("wallet_events").orderBy("server_timestamp", "asc").get();
    const tripProfitMap = new Map();
    const SHARD_COUNT = 10;

    for (const doc of walletEvents.docs) {
        const data = doc.data();
        if (!data.trip_id) continue;

        if (!tripProfitMap.has(data.trip_id)) {
            tripProfitMap.set(data.trip_id, { rev: 0, exp: 0, co: data.company_id, loc: data.location_id, unit: data.unit_id });
        }
        const t = tripProfitMap.get(data.trip_id);
        const et = data.payment_event_type || data.event_type;
        const amount = data.payment_amount || data.amount || 0;

        if (["deposit", "transfer_received", "revenue_cash", "payment_received"].includes(et)) {
            t.rev += amount;
        } else if (["expense", "expense_trip", "expense_purchase", "transfer_initiated", "payment_made"].includes(et)) {
            t.exp += amount;
        }
    }

    for (const [tripId, v] of tripProfitMap.entries()) {
        // We write to Shard 0 for simplicity during rebuild if no actual shard info exists in old ledger
        // But the audit wants a rebuild. So we'll put it in one shard.
        const shardRef = db.collection("trip_profit_views").doc(`${tripId}__S0`);
        await shardRef.set({
            company_id: v.co, location_id: v.loc, unit_id: v.unit,
            total_revenue: v.rev, total_expenses: v.exp, net_profit: v.rev - v.exp,
            last_updated: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    console.log("\n  4. Rebuilding Transactional Projections (Payables, Receivables, Transfers)...");
    const documents = await db.collection("documents").orderBy("server_timestamp", "asc").get();

    for (const doc of documents.docs) {
        const d = doc.data();
        const docId = doc.id;

        // Payables/Receivables
        if (d.supplier_id && d.is_credit) {
            const amount = (d.lines || []).reduce((acc, l) => acc + (l.amount * (l.unit_cost || 0)), 0);
            await db.collection("payable_views").doc(docId).set({
                document_id: docId, company_id: d.company_id, location_id: d.location_id, unit_id: d.unit_id,
                supplier_id: d.supplier_id, amount, due_date: d.due_date || null,
                status: "pending", server_timestamp: d.server_timestamp
            });
        }
        if (d.customer_id && d.is_credit) {
            const amount = (d.lines || []).reduce((acc, l) => acc + (l.amount * (l.unit_price || 0)), 0);
            await db.collection("receivable_views").doc(docId).set({
                document_id: docId, company_id: d.company_id, location_id: d.location_id, unit_id: d.unit_id,
                customer_id: d.customer_id, amount, due_date: d.due_date || null,
                status: "pending", server_timestamp: d.server_timestamp
            });
        }

        // Handle Payment reconciliation in rebuild
        if (d.document_type === "payment_payable" && d.source_document_id) {
            await db.collection("payable_views").doc(d.source_document_id).update({ status: "settled", payment_doc: docId });
        }
        if (d.document_type === "payment_receivable" && d.source_document_id) {
            await db.collection("receivable_views").doc(d.source_document_id).update({ status: "settled", payment_doc: docId });
        }

        // Transfers
        if (d.document_type === "transfer_interlocation") {
            const toLoc = (d.lines || []).find(l => l.event_type === "transfer_received")?.location_id;
            await db.collection("transfer_views").doc(docId).set({
                document_id: docId, company_id: d.company_id, location_id: d.location_id, unit_id: d.unit_id,
                from_location: d.location_id, to_location: toLoc || null,
                status: "posted", initiated_at: d.server_timestamp, last_updated: d.server_timestamp
            });
        }

        // Settlements & Closures
        if (d.document_type === "trip_closure" && d.trip_id) {
            const prof = tripProfitMap.get(d.trip_id) || { rev: 0, exp: 0 };
            await db.collection("settlement_views").doc(d.trip_id).set({
                trip_id: d.trip_id, company_id: d.company_id, location_id: d.location_id, unit_id: d.unit_id,
                total_revenue: prof.rev, total_expenses: prof.exp, net_profit: prof.rev - prof.exp,
                status: "settled", server_timestamp: d.server_timestamp
            });

            // Rebuild boat_profit_views
            const boatKey = `${d.company_id}__${d.unit_id}__S0`;
            await db.collection("boat_profit_views").doc(boatKey).set({
                company_id: d.company_id, location_id: d.location_id, unit_id: d.unit_id,
                total_revenue: admin.firestore.FieldValue.increment(prof.rev),
                total_expenses: admin.firestore.FieldValue.increment(prof.exp),
                total_profit: admin.firestore.FieldValue.increment(prof.rev - prof.exp),
                trip_count: admin.firestore.FieldValue.increment(1),
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    }

    console.log("\n  5. Rebuilding Factory Efficiency...");
    const batches = await db.collection("processing_batches").get();
    for (const b of batches.docs) {
        const d = b.data();
        const facPerfId = `${d.company_id}__${d.unit_id}__S0`;
        await db.collection("factory_performance_views").doc(facPerfId).set({
            company_id: d.company_id, location_id: d.location_id, unit_id: d.unit_id,
            total_input_qty: admin.firestore.FieldValue.increment(d.input_qty),
            total_output_qty: admin.firestore.FieldValue.increment(d.output_qty),
            waste_qty: admin.firestore.FieldValue.increment(d.waste_qty),
            processing_volume: admin.firestore.FieldValue.increment(1),
            last_updated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    console.log("\n  ✅ SUCCESS: Database fully reconstructed from immutable journal.");
}

rebuild().catch(e => { console.error(e); process.exit(1); });
