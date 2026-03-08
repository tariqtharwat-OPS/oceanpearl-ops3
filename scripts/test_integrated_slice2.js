/**
 * OPS3 — Phase 2 Integrated Slice 2
 * Network Scale + Multi-Stage Factory Flow
 * 
 * Scenario:
 * 1. Boat A (Kaimana) catches 300kg Snapper.
 * 2. Boat B (Kaimana) catches 200kg Grouper.
 * 3. Both trips close.
 * 4. Hub (Kaimana) receives both.
 * 5. Hub moves Snapper to Factory-1 (Kaimana).
 * 6. Factory-1 processes Snapper batch (300kg -> 140kg Fillet + 10kg Roe + 150kg Waste).
 * 7. Factory-1 moves Fillet to WIP stage.
 * 8. Factory-1 moves Fillet from WIP to Finished Goods.
 * 9. Finished Goods transferred to Cold Storage (Sorong).
 * 10. Reconciliation across locations and units.
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
    const nonce = `slice2_${step}_${Date.now()}`;
    const key = hmac(payload, nonce);
    await db.collection("document_requests").doc(key).set({
        ...payload,
        idempotency_key: key,
        nonce,
    });
    await sleep(3500);
    return key;
}

async function clearEmulator() {
    const cols = ["stock_views", "processing_batches", "documents", "inventory_states", "inventory_events",
        "wallet_states", "wallet_events", "idempotency_locks", "document_requests", "trip_states"];
    for (const c of cols) {
        const s = await db.collection(c).get();
        const batch = db.batch();
        s.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const CO = "Ocean-Pearl-SC";
const LOC_K = "Kaimana";
const LOC_S = "Sorong";

const BOAT_A = "Boat-KM-A";
const BOAT_B = "Boat-KM-B";
const HUB = "Hub-Intake-KM";
const FACTORY_PROC = "Factory-Proc-KM";
const FACTORY_WIP = "Factory-WIP-KM";
const FACTORY_FIN = "Factory-Finished-KM";
const COLD_S = "ColdStore-SR";

const TRIP_A = "TRIP-A-001";
const TRIP_B = "TRIP-B-001";

async function run() {
    console.log("══════════════════════════════════════════════════════════════");
    console.log("  OPS3 — Integrated Operational Slice 2 (Network Scale)");
    console.log("══════════════════════════════════════════════════════════════\n");

    await clearEmulator();
    console.log("✓ Emulator cleared\n");

    let errors = 0;
    function check(label, actual, expected) {
        const pass = JSON.stringify(actual) === JSON.stringify(expected);
        console.log(`  ${pass ? "✅" : "❌"} ${label}: ${actual} (expected ${expected})`);
        if (!pass) errors++;
    }

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 1 — Multiple Boats Landing
    // ───────────────────────────────────────────────────────────────────────
    console.log("═══ STAGE 1: Multiple Boats Landing ═══");

    await post({
        document_id: "LANDING-A", document_type: "receiving",
        company_id: CO, location_id: LOC_K, unit_id: BOAT_A, trip_id: TRIP_A,
        lines: [{
            sku_id: "snapper-whole", amount: 300, event_type: "receive_own", unit_type: "boat",
            location_id: LOC_K, unit_id: BOAT_A, unit_cost: 40000
        }]
    });

    await post({
        document_id: "LANDING-B", document_type: "receiving",
        company_id: CO, location_id: LOC_K, unit_id: BOAT_B, trip_id: TRIP_B,
        lines: [{
            sku_id: "grouper-whole", amount: 200, event_type: "receive_own", unit_type: "boat",
            location_id: LOC_K, unit_id: BOAT_B, unit_cost: 60000
        }]
    });

    // Close trips
    await post({ document_id: "CLOSE-A", document_type: "trip_closure", company_id: CO, location_id: LOC_K, unit_id: BOAT_A, trip_id: TRIP_A, lines: [] });
    await post({ document_id: "CLOSE-B", document_type: "trip_closure", company_id: CO, location_id: LOC_K, unit_id: BOAT_B, trip_id: TRIP_B, lines: [] });

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 2 — Hub Consolidated Receive
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 2: Hub Consolidated Receive ═══");

    const hubDoc = await post({
        document_id: "HUB-REC-SLICE2", document_type: "hub_receive_from_boat",
        company_id: CO, location_id: LOC_K, unit_id: HUB,
        lines: [
            { sku_id: "snapper-whole", amount: 300, event_type: "transfer_initiated", location_id: LOC_K, unit_id: BOAT_A, trip_id: TRIP_A, unit_type: "boat" },
            { sku_id: "snapper-whole", amount: 300, event_type: "transfer_received", location_id: LOC_K, unit_id: HUB, unit_cost: 40000, trip_id: TRIP_A, unit_type: "hub_intake" },
            { sku_id: "grouper-whole", amount: 200, event_type: "transfer_initiated", location_id: LOC_K, unit_id: BOAT_B, trip_id: TRIP_B, unit_type: "boat" },
            { sku_id: "grouper-whole", amount: 200, event_type: "transfer_received", location_id: LOC_K, unit_id: HUB, unit_cost: 60000, trip_id: TRIP_B, unit_type: "hub_intake" }
        ]
    });

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 3 — Factory Processing Stage 1 (Hub → Proc)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 3: Hub → Factory Processing ═══");

    await post({
        document_id: "MOVE-TO-FACTORY", document_type: "transfer_internal",
        company_id: CO, location_id: LOC_K, unit_id: FACTORY_PROC,
        lines: [
            { sku_id: "snapper-whole", amount: 300, event_type: "transfer_initiated", location_id: LOC_K, unit_id: HUB, unit_type: "hub_intake" },
            { sku_id: "snapper-whole", amount: 300, event_type: "transfer_received", location_id: LOC_K, unit_id: FACTORY_PROC, unit_cost: 40000, unit_type: "factory_processing" }
        ]
    });

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 4 — Production Transformation (Snapper Batch)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 4: Transformation (300kg Snapper) ═══");

    const batchId = "BATCH-KM-S2-001";
    const transformDoc = await post({
        document_id: "TRANSFORM-S2", document_type: "inventory_transformation",
        company_id: CO, location_id: LOC_K, unit_id: FACTORY_PROC,
        batch_id: batchId, source_receiving_doc: hubDoc,
        lines: [
            { sku_id: "snapper-whole", amount: 300, event_type: "transformation_out", location_id: LOC_K, unit_id: FACTORY_PROC, unit_type: "factory_processing" },
            { sku_id: "snapper-fillet", amount: 140, event_type: "transformation_in", location_id: LOC_K, unit_id: FACTORY_PROC, unit_type: "factory_processing", batch_id: batchId },
            { sku_id: "snapper-roe", amount: 10, event_type: "transformation_in", location_id: LOC_K, unit_id: FACTORY_PROC, unit_type: "factory_processing", batch_id: batchId },
            { sku_id: "organic-waste", amount: 150, event_type: "transformation_in", location_id: LOC_K, unit_id: FACTORY_PROC, unit_type: "factory_processing" }
        ]
    });

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 5 — Factory WIP Movement (Proc → WIP → Finished)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 5: Factory Multi-Stage Movement (Proc → WIP → Fin) ═══");

    // Move to WIP
    await post({
        document_id: "TO-WIP", document_type: "transfer_internal",
        company_id: CO, location_id: LOC_K, unit_id: FACTORY_WIP,
        lines: [
            { sku_id: "snapper-fillet", amount: 140, event_type: "transfer_initiated", location_id: LOC_K, unit_id: FACTORY_PROC, unit_type: "factory_processing", batch_id: batchId },
            { sku_id: "snapper-fillet", amount: 140, event_type: "transfer_received", location_id: LOC_K, unit_id: FACTORY_WIP, unit_cost: 40000, unit_type: "factory_wip", batch_id: batchId }
        ]
    });

    // Move to Finished
    await post({
        document_id: "TO-FIN", document_type: "transfer_internal",
        company_id: CO, location_id: LOC_K, unit_id: FACTORY_FIN,
        lines: [
            { sku_id: "snapper-fillet", amount: 140, event_type: "transfer_initiated", location_id: LOC_K, unit_id: FACTORY_WIP, unit_type: "factory_wip", batch_id: batchId },
            { sku_id: "snapper-fillet", amount: 140, event_type: "transfer_received", location_id: LOC_K, unit_id: FACTORY_FIN, unit_cost: 40000, unit_type: "factory_finished", batch_id: batchId }
        ]
    });

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 6 — Inter-Location Transfer (Sorong)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 6: Inter-Location Transfer (Kaimana → Sorong) ═══");

    await post({
        document_id: "TRANSFER-SR", document_type: "transfer_interlocation",
        company_id: CO, location_id: LOC_K, unit_id: FACTORY_FIN,
        lines: [
            { sku_id: "snapper-fillet", amount: 100, event_type: "transfer_initiated", location_id: LOC_K, unit_id: FACTORY_FIN, unit_type: "factory_finished", batch_id: batchId },
            { sku_id: "snapper-fillet", amount: 100, event_type: "transfer_received", location_id: LOC_S, unit_id: COLD_S, unit_cost: 40000, unit_type: "cold_storage", batch_id: batchId }
        ]
    });

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 7 — NETWORK STOCK VIEW (Step E)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 7: Unified Network Stock View (via stock_views) ═══");

    const views = await db.collection("stock_views").get();
    const stockReport = [];
    views.forEach(doc => {
        const data = doc.data();
        if (data.qty > 0) {
            stockReport.push({
                location: data.location_id,
                unit: data.unit_id,
                sku: data.sku_id,
                qty: data.qty,
                cost: data.avg_cost
            });
        }
    });

    console.table(stockReport);

    // ───────────────────────────────────────────────────────────────────────
    // RECONCILIATION
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ FINAL RECONCILIATION ═══");

    const kFinFillet = stockReport.find(s => s.unit === FACTORY_FIN && s.sku === "snapper-fillet")?.qty || 0;
    const sColdFillet = stockReport.find(s => s.unit === COLD_S && s.sku === "snapper-fillet")?.qty || 0;
    check("Total Snapper Fillet (140 produced)", kFinFillet + sColdFillet, 140);

    const kRoe = stockReport.find(s => s.unit === FACTORY_PROC && s.sku === "snapper-roe")?.qty || 0;
    check("Total Roe", kRoe, 10);

    const kHubGrouper = stockReport.find(s => s.unit === HUB && s.sku === "grouper-whole")?.qty || 0;
    check("Hub Grouper (not processed)", kHubGrouper, 200);

    const pending = await db.collection("document_requests").get();
    check("Orphan requests", pending.size, 0);

    console.log("\n══════════════════════════════════════════════════════════════");
    if (errors === 0) {
        console.log("  ✅ ALL CHECKS PASSED — Network Slice 2 Verified");
    } else {
        console.log(`  ❌ ${errors} CHECK(S) FAILED`);
        process.exit(1);
    }
    console.log("══════════════════════════════════════════════════════════════\n");
}

run().catch(e => { console.error(e); process.exit(1); });
