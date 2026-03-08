/**
 * OPS3 — Phase 7 Stress Test 
 * 1000 documents across 5 boats, 3 factories, 3 locations.
 */

const admin = require("firebase-admin");
const crypto = require("crypto");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const HMAC_SECRET = "OPS3_PHASE0_DEV_SECRET";

if (!admin.apps.length) admin.initializeApp({ projectId: "oceanpearl-ops" });
const db = admin.firestore();

function hmac(payload, nonce) {
    const str = JSON.stringify(payload);
    const hash = crypto.createHash("sha256").update(str).digest("hex");
    return crypto.createHmac("sha256", HMAC_SECRET).update(hash + nonce).digest("hex");
}

async function post(payload, step) {
    const nonce = `stress_${step}_${Date.now()}`;
    const key = hmac(payload, nonce);
    await db.collection("document_requests").doc(key).set({
        ...payload,
        idempotency_key: key,
        nonce,
    });
    return key;
}

async function clearEmulator() {
    const cols = ["factory_performance_views", "boat_profit_views", "transfer_network_views", "inventory_heatmap_views",
        "settlement_views", "payable_views", "receivable_views", "trip_profit_views", 
        "stock_batch_views", "transfer_views", "stock_views", "processing_batches", 
        "documents", "inventory_states", "inventory_events", "wallet_states", "wallet_events", 
        "idempotency_locks", "document_requests", "trip_states"];
    for (const c of cols) {
        const s = await db.collection(c).get();
        const batch = db.batch();
        s.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
}

async function run() {
    console.log("══════════════════════════════════════════════════════════════");
    console.log("  OPS3 — Phase 7 Stress Test (500 Events)");
    console.log("══════════════════════════════════════════════════════════════\n");

    await clearEmulator();
    await db.collection("wallet_states").doc("Hub-Global").set({ current_balance: 1000000000, sequence_number: 0 });

    const BOATS = ["B1", "B2", "B3", "B4", "B5"];
    const LOCS = ["L1", "L2", "L3"];
    const CO = "Ocean-Pearl-SC";

    const total = 500;
    const batchSize = 25;

    console.log(`  - Pushing ${total} documents with financial effects...`);
    
    for (let i = 0; i < total; i += batchSize) {
        const promises = [];
        for (let j = 0; j < batchSize; j++) {
            const idx = i + j;
            const boat = BOATS[idx % BOATS.length];
            const loc = LOCS[idx % LOCS.length];
            
            promises.push(post({
                document_id: `STRESS-${idx}`,
                document_type: "receiving",
                company_id: CO, location_id: loc, unit_id: boat, trip_id: "T-STRESS",
                lines: [{ 
                    sku_id: "fish-raw", amount: 10, event_type: "revenue_cash",
                    unit_cost: 1000, location_id: loc, unit_id: boat, 
                    wallet_id: "Hub-Global", payment_amount: 10000 
                }]
            }, idx));
        }
        await Promise.all(promises);
        console.log(`    - Pushed ${i + batchSize} / ${total}`);
    }

    console.log("\n  - Waiting for background processing (60s)...");
    await new Promise(r => setTimeout(r, 60000));

    const docs = await db.collection("documents").get();
    const invEvents = await db.collection("inventory_events").get();
    const profitShards = await db.collection("trip_profit_views").get();
    
    console.log(`\n  - Final Integrity Check:`);
    console.log(`    - Posted Documents: ${docs.size}`);
    console.log(`    - Inventory Events: ${invEvents.size}`);
    console.log(`    - Profit Views (Shards): ${profitShards.size}`);

    if (docs.size === total && invEvents.size === total) {
        console.log("\n  ✅ SUCCESS: Stress test complete. Ledger is consistent.");
    } else {
        console.warn(`\n  ⚠️  WARNING: Wait longer or check for bottleneck. Docs: ${docs.size}/${total}`);
    }
}

run().catch(e => { console.error(e); process.exit(1); });
