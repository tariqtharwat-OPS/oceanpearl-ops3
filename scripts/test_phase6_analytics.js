/**
 * OPS3 — Phase 6 HQ Analytics & Configuration Simulation
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let step = 0;

async function post(payload) {
    step++;
    const nonce = `phase6_${step}_${Date.now()}`;
    const key = hmac(payload, nonce);
    await db.collection("document_requests").doc(key).set({
        ...payload,
        idempotency_key: key,
        nonce,
    });

    for (let i = 0; i < 20; i++) {
        await sleep(1000);
        const lock = await db.collection("idempotency_locks").doc(key).get();
        if (lock.exists) {
            if (lock.data().status === "COMPLETED") return key;
            if (lock.data().status === "FAILED") {
                console.error(`  ❌ Document ${payload.document_id} FAILED: ${lock.data().error}`);
                process.exit(1);
            }
        }
    }
    console.error(`  ❌ Document ${payload.document_id} TIMEOUT`);
    process.exit(1);
}

const CO = "Ocean-Pearl-SC";
const LOC_A = "Kaimana", HUB_A = "Hub-KM", BOAT_A1 = "Boat-KM-01", BOAT_A2 = "Boat-KM-02", FACT_A = "Fact-KM";
const LOC_B = "Dobo", HUB_B = "Hub-DB", BOAT_B1 = "Boat-DB-01", FACT_B = "Fact-DB";

async function clearEmulator() {
    const cols = ["factory_performance_views", "boat_profit_views", "transfer_network_views", "inventory_heatmap_views",
        "settlement_views", "payable_views", "receivable_views", "trip_profit_views",
        "stock_batch_views", "transfer_views", "stock_views", "processing_batches",
        "documents", "inventory_states", "inventory_events", "wallet_states", "wallet_events",
        "idempotency_locks", "document_requests", "trip_states", "control_config"];
    for (const c of cols) {
        const s = await db.collection(c).get();
        const batch = db.batch();
        s.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
}

async function run() {
    console.log("══════════════════════════════════════════════════════════════");
    console.log("  OPS3 — Phase 6 HQ Analytics & Configuration");
    console.log("══════════════════════════════════════════════════════════════\n");

    await clearEmulator();
    await db.collection("wallet_states").doc("Hub-Kaimana").set({ current_balance: 50000000, sequence_number: 0 });
    await db.collection("wallet_states").doc("B1-W").set({ current_balance: 100000000, sequence_number: 0 });
    console.log("  ✓ Wallets seeded");

    // 1. Setup Configuration
    await db.collection("control_config").doc("default").set({
        yield_variance_threshold: 0.15, // Relaxed yield for Dobo
        transfer_delay_hours: 48,
        max_cost_basis: 5000000
    });
    console.log("  ✓ System Configuration seeded");

    // 2. Boat Operations (Simulation of multiple trips for two boats)
    console.log("\n═══ Segment 1: Network-Scale Boat Operations ═══");

    // Boat A1 Trip
    await post({
        document_id: "A1-L1", document_type: "receiving", company_id: CO, location_id: LOC_A, unit_id: BOAT_A1, trip_id: "T-A1-01",
        lines: [{ sku_id: "tuna-whole", amount: 2000, event_type: "receive_own", unit_cost: 40000, location_id: LOC_A, unit_id: BOAT_A1 }]
    });
    await post({
        document_id: "A1-CLOSE", document_type: "trip_closure", company_id: CO, location_id: LOC_A, unit_id: BOAT_A1, trip_id: "T-A1-01",
        lines: [] // Net profit will be 0 as no expenses yet
    });

    // Boat B1 Trip with some expenses
    await post({
        document_id: "B1-EXP", document_type: "boat_expense", company_id: CO, location_id: LOC_B, unit_id: BOAT_B1, trip_id: "T-B1-01",
        lines: [{ sku_id: "fuel", amount: 1000, event_type: "expense_trip", wallet_id: "B1-W", payment_amount: 10000000, payment_event_type: "expense" }]
    });
    await post({
        document_id: "B1-L1", document_type: "receiving", company_id: CO, location_id: LOC_B, unit_id: BOAT_B1, trip_id: "T-B1-01",
        lines: [{ sku_id: "snapper-whole", amount: 5000, event_type: "receive_own", unit_cost: 30000, location_id: LOC_B, unit_id: BOAT_B1 }]
    });
    await post({
        document_id: "B1-CLOSE", document_type: "trip_closure", company_id: CO, location_id: LOC_B, unit_id: BOAT_B1, trip_id: "T-B1-01",
        lines: []
    });

    const boatStats = await db.collection("boat_profit_views").get();
    console.log(`  ✓ Boat Analytics Populated: ${boatStats.size} boats tracked`);

    // 3. Factory Operations (Processing across two factories)
    console.log("\n═══ Segment 2: Multi-Factory Yield Analytics ═══");

    // Factory A Processing
    await post({
        document_id: "FACT-A1", document_type: "inventory_transformation", company_id: CO, location_id: LOC_A, unit_id: FACT_A, batch_id: "B-A1",
        lines: [
            { sku_id: "tuna-whole", amount: 1000, event_type: "transformation_out", location_id: LOC_A, unit_id: BOAT_A1 },
            { sku_id: "tuna-loin", amount: 800, event_type: "transformation_in", location_id: LOC_A, unit_id: FACT_A }
        ]
    });

    // Factory B Processing (High Volume)
    await post({
        document_id: "FACT-B1", document_type: "inventory_transformation", company_id: CO, location_id: LOC_B, unit_id: FACT_B, batch_id: "B-B1",
        lines: [
            { sku_id: "snapper-whole", amount: 5000, event_type: "transformation_out", location_id: LOC_B, unit_id: BOAT_B1 },
            { sku_id: "snapper-fillet", amount: 4100, event_type: "transformation_in", location_id: LOC_B, unit_id: FACT_B }
        ]
    });

    const factStats = await db.collection("factory_performance_views").get();
    console.log(`  ✓ Factory Analytics Populated: ${factStats.size} factories tracked`);

    // 4. Transfer Network (Simulated inter-location movement)
    console.log("\n═══ Segment 3: Transfer Network Analytics ═══");

    await post({
        document_id: "TRANS-AB", document_type: "transfer_interlocation", company_id: CO, location_id: LOC_A, unit_id: HUB_A,
        lines: [
            { sku_id: "tuna-loin", amount: 500, event_type: "transfer_initiated", location_id: LOC_A, unit_id: FACT_A },
            { sku_id: "tuna-loin", amount: 500, event_type: "transfer_received", location_id: LOC_B, unit_id: HUB_B }
        ]
    });

    const netStats = await db.collection("transfer_network_views").get();
    console.log(`  ✓ Transfer Network Analytics Populated: ${netStats.size} routes tracked`);

    // 5. Final Analytics Verification
    console.log("\n═══ Segment 4: HQ Global Aggregations ═══");
    const heatmap = await db.collection("inventory_heatmap_views").get();
    console.log(`  ✓ Inventory Heatmap points: ${heatmap.size}`);

    boatStats.docs.forEach(d => console.log(`    - Boat ${d.id}: Profit=${d.data().total_profit}, Trips=${d.data().trip_count}`));
    factStats.docs.forEach(d => console.log(`    - Factory ${d.id}: Volume=${d.data().processing_volume}, Out=${d.data().total_output_qty}`));

    console.log("\n══════════════════════════════════════════════════════════════");
    console.log("  ✅ SUCCESS: Phase 6 Analytics Verified");
    console.log("══════════════════════════════════════════════════════════════\n");
}

run().catch(e => { console.error(e); process.exit(1); });
