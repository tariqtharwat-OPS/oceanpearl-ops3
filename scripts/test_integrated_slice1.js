/**
 * OPS3 — Phase 2 Integrated Operational Slice 1
 * Full chain: Boat → Hub Receiving → Factory Processing → Cold Storage Transfer
 *
 * Unit Types:
 *   boat             — Vessel catching fish at sea
 *   hub_intake        — Landing dock receiving from boats
 *   factory_processing — Raw material intake for processing
 *   factory_finished  — Processed output ready for dispatch
 *   cold_storage      — Cold storage at destination location
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
    const nonce = `slice1_${step}_${Date.now()}`;
    const key = hmac(payload, nonce);
    await db.collection("document_requests").doc(key).set({
        ...payload,
        idempotency_key: key,
        nonce,
    });
    await sleep(3500);
    return key;
}

async function inv(loc, unit, sku) {
    const d = await db.collection("inventory_states").doc(`${loc}__${unit}__${sku}`).get();
    return d.exists ? d.data() : null;
}

async function clearEmulator() {
    const cols = ["processing_batches", "documents", "inventory_states", "inventory_events",
        "wallet_states", "wallet_events", "idempotency_locks", "document_requests", "trip_states"];
    for (const c of cols) {
        const s = await db.collection(c).get();
        const batch = db.batch();
        s.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const CO = "Ocean-Pearl-SC";
const LOC_KAIMANA = "Kaimana";
const LOC_SORONG = "Sorong";

const BOAT_A = "Boat-KM-01";
const HUB_INTAKE = "Hub-Intake-KM";
const FACTORY_PROC = "Factory-Proc-KM";
const FACTORY_FIN = "Factory-Finished-KM";
const COLD_STORAGE = "ColdStore-SR-01";

const TRIP_A = "TRIP-KM-2026-001";

async function run() {
    console.log("══════════════════════════════════════════════════════════════");
    console.log("  OPS3 — Integrated Operational Slice 1");
    console.log("══════════════════════════════════════════════════════════════\n");

    await clearEmulator();
    console.log("✓ Emulator cleared\n");

    let errors = 0;
    function check(label, actual, expected) {
        const pass = actual === expected;
        console.log(`  ${pass ? "✅" : "❌"} ${label}: ${actual} (expected ${expected})`);
        if (!pass) errors++;
    }

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 1 — Boat catches fish at sea
    // ───────────────────────────────────────────────────────────────────────
    console.log("═══ STAGE 1: Boat catches fish at sea ═══");

    const seedDoc = await post({
        document_id: "CATCH-001",
        document_type: "receiving",
        company_id: CO, location_id: LOC_KAIMANA, unit_id: BOAT_A,
        trip_id: TRIP_A,
        lines: [
            {
                sku_id: "whole-snapper", amount: 200, event_type: "receive_own",
                location_id: LOC_KAIMANA, unit_id: BOAT_A, unit_cost: 45000
            },
            {
                sku_id: "whole-grouper", amount: 80, event_type: "receive_own",
                location_id: LOC_KAIMANA, unit_id: BOAT_A, unit_cost: 65000
            },
        ],
    });

    let s = await inv(LOC_KAIMANA, BOAT_A, "whole-snapper");
    check("Boat snapper", s?.current_balance, 200);
    s = await inv(LOC_KAIMANA, BOAT_A, "whole-grouper");
    check("Boat grouper", s?.current_balance, 80);

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 2 — Trip closes
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 2: Trip closure ═══");

    await post({
        document_id: "CLOSE-001",
        document_type: "trip_closure",
        company_id: CO, location_id: LOC_KAIMANA, unit_id: BOAT_A,
        trip_id: TRIP_A,
        lines: [],
    });

    const tripDoc = await db.collection("trip_states").doc(TRIP_A).get();
    check("Trip status", tripDoc.data()?.status, "closed");

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 3 — Hub receives fish from closed boat trip
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 3: Hub receives from boat ═══");

    const hubReceiveDoc = await post({
        document_id: "HUBREC-001",
        document_type: "hub_receive_from_boat",
        company_id: CO, location_id: LOC_KAIMANA, unit_id: HUB_INTAKE,
        trip_id: TRIP_A,
        source_document_id: seedDoc,
        boat_unit_id: BOAT_A,
        lines: [
            // Transfer OUT from boat
            {
                sku_id: "whole-snapper", amount: 200, event_type: "transfer_initiated",
                location_id: LOC_KAIMANA, unit_id: BOAT_A
            },
            // Transfer IN to hub intake
            {
                sku_id: "whole-snapper", amount: 200, event_type: "transfer_received",
                location_id: LOC_KAIMANA, unit_id: HUB_INTAKE, unit_cost: 45000
            },
            // Transfer OUT from boat
            {
                sku_id: "whole-grouper", amount: 80, event_type: "transfer_initiated",
                location_id: LOC_KAIMANA, unit_id: BOAT_A
            },
            // Transfer IN to hub intake
            {
                sku_id: "whole-grouper", amount: 80, event_type: "transfer_received",
                location_id: LOC_KAIMANA, unit_id: HUB_INTAKE, unit_cost: 65000
            },
        ],
    });

    s = await inv(LOC_KAIMANA, BOAT_A, "whole-snapper");
    check("Boat snapper after handover", s?.current_balance, 0);
    s = await inv(LOC_KAIMANA, HUB_INTAKE, "whole-snapper");
    check("Hub snapper received", s?.current_balance, 200);
    s = await inv(LOC_KAIMANA, HUB_INTAKE, "whole-grouper");
    check("Hub grouper received", s?.current_balance, 80);

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 4 — Move to Factory Processing unit
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 4: Hub Intake → Factory Processing ═══");

    await post({
        document_id: "MOVE-TO-PROC-001",
        document_type: "transfer_internal",
        company_id: CO, location_id: LOC_KAIMANA, unit_id: FACTORY_PROC,
        lines: [
            {
                sku_id: "whole-snapper", amount: 200, event_type: "transfer_initiated",
                location_id: LOC_KAIMANA, unit_id: HUB_INTAKE
            },
            {
                sku_id: "whole-snapper", amount: 200, event_type: "transfer_received",
                location_id: LOC_KAIMANA, unit_id: FACTORY_PROC, unit_cost: 45000
            },
        ],
    });

    s = await inv(LOC_KAIMANA, HUB_INTAKE, "whole-snapper");
    check("Hub intake snapper after move", s?.current_balance, 0);
    s = await inv(LOC_KAIMANA, FACTORY_PROC, "whole-snapper");
    check("Factory proc snapper", s?.current_balance, 200);

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 5 — Factory processes batch (transformation)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 5: Factory Processing (Transformation) ═══");
    // 200kg Whole Snapper → 90kg Fillet + 10kg Roe + 100kg Waste

    const batchDoc = await post({
        document_id: "PROC-BATCH-001",
        document_type: "inventory_transformation",
        company_id: CO, location_id: LOC_KAIMANA, unit_id: FACTORY_PROC,
        batch_id: "BATCH-KM-001",
        operator_id: "OP-Ahmad",
        factory_unit_id: FACTORY_PROC,
        source_receiving_doc: hubReceiveDoc,
        lines: [
            {
                sku_id: "whole-snapper", amount: 200, event_type: "transformation_out",
                location_id: LOC_KAIMANA, unit_id: FACTORY_PROC
            },
            {
                sku_id: "snapper-fillet", amount: 90, event_type: "transformation_in",
                location_id: LOC_KAIMANA, unit_id: FACTORY_PROC
            },
            {
                sku_id: "snapper-roe", amount: 10, event_type: "transformation_in",
                location_id: LOC_KAIMANA, unit_id: FACTORY_PROC
            },
            {
                sku_id: "organic-waste", amount: 100, event_type: "transformation_in",
                location_id: LOC_KAIMANA, unit_id: FACTORY_PROC
            },
        ],
    });

    s = await inv(LOC_KAIMANA, FACTORY_PROC, "whole-snapper");
    check("Factory raw snapper after processing", s?.current_balance, 0);
    s = await inv(LOC_KAIMANA, FACTORY_PROC, "snapper-fillet");
    check("Factory fillet produced", s?.current_balance, 90);
    s = await inv(LOC_KAIMANA, FACTORY_PROC, "snapper-roe");
    check("Factory roe produced", s?.current_balance, 10);
    s = await inv(LOC_KAIMANA, FACTORY_PROC, "organic-waste");
    check("Factory waste produced", s?.current_balance, 100);

    // Check batch record
    const batch = await db.collection("processing_batches").doc(batchDoc).get();
    check("Batch yield_ratio", batch.data()?.yield_ratio, 1);
    check("Batch source_receiving_doc", batch.data()?.source_receiving_doc, hubReceiveDoc);

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 6 — Move finished goods to Factory Finished unit
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 6: Factory Proc → Finished Goods ═══");

    await post({
        document_id: "MOVE-TO-FIN-001",
        document_type: "transfer_internal",
        company_id: CO, location_id: LOC_KAIMANA, unit_id: FACTORY_FIN,
        lines: [
            {
                sku_id: "snapper-fillet", amount: 90, event_type: "transfer_initiated",
                location_id: LOC_KAIMANA, unit_id: FACTORY_PROC
            },
            {
                sku_id: "snapper-fillet", amount: 90, event_type: "transfer_received",
                location_id: LOC_KAIMANA, unit_id: FACTORY_FIN, unit_cost: 45000
            },
            {
                sku_id: "snapper-roe", amount: 10, event_type: "transfer_initiated",
                location_id: LOC_KAIMANA, unit_id: FACTORY_PROC
            },
            {
                sku_id: "snapper-roe", amount: 10, event_type: "transfer_received",
                location_id: LOC_KAIMANA, unit_id: FACTORY_FIN, unit_cost: 45000
            },
        ],
    });

    s = await inv(LOC_KAIMANA, FACTORY_FIN, "snapper-fillet");
    check("Finished fillet", s?.current_balance, 90);
    s = await inv(LOC_KAIMANA, FACTORY_FIN, "snapper-roe");
    check("Finished roe", s?.current_balance, 10);

    // ───────────────────────────────────────────────────────────────────────
    // STAGE 7 — Inter-location transfer to Cold Storage (Sorong)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ STAGE 7: Kaimana → Sorong Cold Storage ═══");

    await post({
        document_id: "TRANSFER-SR-001",
        document_type: "transfer_interlocation",
        company_id: CO, location_id: LOC_KAIMANA, unit_id: FACTORY_FIN,
        lines: [
            // Transfer OUT from Kaimana Finished Goods
            {
                sku_id: "snapper-fillet", amount: 50, event_type: "transfer_initiated",
                location_id: LOC_KAIMANA, unit_id: FACTORY_FIN
            },
            // Transfer IN to Sorong Cold Storage
            {
                sku_id: "snapper-fillet", amount: 50, event_type: "transfer_received",
                location_id: LOC_SORONG, unit_id: COLD_STORAGE, unit_cost: 45000
            },
        ],
    });

    s = await inv(LOC_KAIMANA, FACTORY_FIN, "snapper-fillet");
    check("Kaimana fillet remaining", s?.current_balance, 40);
    s = await inv(LOC_SORONG, COLD_STORAGE, "snapper-fillet");
    check("Sorong cold storage fillet", s?.current_balance, 50);

    // ───────────────────────────────────────────────────────────────────────
    // FINAL — Ledger Reconciliation
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ LEDGER RECONCILIATION ═══");

    // Total snapper fillet: 40 (Kaimana Finished) + 50 (Sorong Cold) = 90
    const kFillet = (await inv(LOC_KAIMANA, FACTORY_FIN, "snapper-fillet"))?.current_balance || 0;
    const sFillet = (await inv(LOC_SORONG, COLD_STORAGE, "snapper-fillet"))?.current_balance || 0;
    check("Total fillet across locations", kFillet + sFillet, 90);

    // Roe: 10 in Kaimana Finished
    const kRoe = (await inv(LOC_KAIMANA, FACTORY_FIN, "snapper-roe"))?.current_balance || 0;
    check("Total roe", kRoe, 10);

    // Waste: 100 in Factory Proc
    const kWaste = (await inv(LOC_KAIMANA, FACTORY_PROC, "organic-waste"))?.current_balance || 0;
    check("Total waste", kWaste, 100);

    // Boat should be empty
    const boatSnapper = (await inv(LOC_KAIMANA, BOAT_A, "whole-snapper"))?.current_balance || 0;
    const boatGrouper = (await inv(LOC_KAIMANA, BOAT_A, "whole-grouper"))?.current_balance || 0;
    check("Boat snapper (should be 0)", boatSnapper, 0);
    check("Boat grouper (should be 0 — still at hub)", boatGrouper, 0);

    // Hub intake grouper (not yet processed)
    const hubGrouper = (await inv(LOC_KAIMANA, HUB_INTAKE, "whole-grouper"))?.current_balance || 0;
    check("Hub grouper remaining", hubGrouper, 80);

    // Document count
    const docs = await db.collection("documents").get();
    check("Documents posted", docs.size, 7);

    // Inventory events count
    const invEvents = await db.collection("inventory_events").get();
    console.log(`  📊 Inventory events: ${invEvents.size}`);

    // Processing batches
    const batches = await db.collection("processing_batches").get();
    check("Processing batches", batches.size, 1);

    // Orphan check: no pending document_requests
    const pending = await db.collection("document_requests").get();
    check("Orphan requests (should be 0)", pending.size, 0);

    console.log("\n══════════════════════════════════════════════════════════════");
    if (errors === 0) {
        console.log("  ✅ ALL CHECKS PASSED — Integrated Slice 1 Verified");
    } else {
        console.log(`  ❌ ${errors} CHECK(S) FAILED`);
    }
    console.log("══════════════════════════════════════════════════════════════\n");
    process.exit(errors > 0 ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); });
