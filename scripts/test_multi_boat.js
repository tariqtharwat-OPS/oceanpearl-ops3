/**
 * OPS3 — Multi-Boat / Multi-Factory Concurrency Scenario
 * 2 Boats, 1 Hub, 1 Factory, 2 Locations
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
    const nonce = `multi_${step}_${Date.now()}`;
    const key = hmac(payload, nonce);
    await db.collection("document_requests").doc(key).set({
        ...payload, idempotency_key: key, nonce,
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

const CO = "Ocean-Pearl-SC";
const LOC_K = "Kaimana";
const LOC_S = "Sorong";

const BOAT_1 = "Boat-KM-01";
const BOAT_2 = "Boat-KM-02";
const HUB = "Hub-Intake-KM";
const FACTORY = "Factory-Proc-KM";
const FINISHED = "Factory-Finished-KM";
const COLD_S = "ColdStore-SR-01";

async function run() {
    console.log("══════════════════════════════════════════════════════════════");
    console.log("  OPS3 — Multi-Boat / Multi-Factory Scenario");
    console.log("══════════════════════════════════════════════════════════════\n");

    await clearEmulator();
    let errors = 0;
    function check(label, actual, expected) {
        const pass = actual === expected;
        console.log(`  ${pass ? "✅" : "❌"} ${label}: ${actual} (expected ${expected})`);
        if (!pass) errors++;
    }

    // ═══ BOAT 1: Catches 150kg snapper ═══
    console.log("═══ Boat 1: Catch ═══");
    await post({
        document_id: "CATCH-B1", document_type: "receiving",
        company_id: CO, location_id: LOC_K, unit_id: BOAT_1,
        trip_id: "TRIP-B1-001",
        lines: [{
            sku_id: "whole-snapper", amount: 150, event_type: "receive_own",
            location_id: LOC_K, unit_id: BOAT_1, unit_cost: 45000
        }],
    });

    // ═══ BOAT 2: Catches 100kg snapper + 50kg grouper ═══
    console.log("═══ Boat 2: Catch ═══");
    await post({
        document_id: "CATCH-B2", document_type: "receiving",
        company_id: CO, location_id: LOC_K, unit_id: BOAT_2,
        trip_id: "TRIP-B2-001",
        lines: [
            {
                sku_id: "whole-snapper", amount: 100, event_type: "receive_own",
                location_id: LOC_K, unit_id: BOAT_2, unit_cost: 50000
            },
            {
                sku_id: "whole-grouper", amount: 50, event_type: "receive_own",
                location_id: LOC_K, unit_id: BOAT_2, unit_cost: 70000
            },
        ],
    });

    check("Boat1 snapper", (await inv(LOC_K, BOAT_1, "whole-snapper"))?.current_balance, 150);
    check("Boat2 snapper", (await inv(LOC_K, BOAT_2, "whole-snapper"))?.current_balance, 100);
    check("Boat2 grouper", (await inv(LOC_K, BOAT_2, "whole-grouper"))?.current_balance, 50);

    // ═══ Close both trips ═══
    console.log("\n═══ Close both trips ═══");
    await post({
        document_id: "CLOSE-B1", document_type: "trip_closure",
        company_id: CO, location_id: LOC_K, unit_id: BOAT_1,
        trip_id: "TRIP-B1-001", lines: [],
    });
    await post({
        document_id: "CLOSE-B2", document_type: "trip_closure",
        company_id: CO, location_id: LOC_K, unit_id: BOAT_2,
        trip_id: "TRIP-B2-001", lines: [],
    });

    // ═══ Hub receives from both boats ═══
    console.log("\n═══ Hub receives from both boats ═══");
    await post({
        document_id: "HUBREC-B1", document_type: "hub_receive_from_boat",
        company_id: CO, location_id: LOC_K, unit_id: HUB,
        trip_id: "TRIP-B1-001", boat_unit_id: BOAT_1,
        lines: [
            {
                sku_id: "whole-snapper", amount: 150, event_type: "transfer_initiated",
                location_id: LOC_K, unit_id: BOAT_1
            },
            {
                sku_id: "whole-snapper", amount: 150, event_type: "transfer_received",
                location_id: LOC_K, unit_id: HUB, unit_cost: 45000
            },
        ],
    });
    await post({
        document_id: "HUBREC-B2", document_type: "hub_receive_from_boat",
        company_id: CO, location_id: LOC_K, unit_id: HUB,
        trip_id: "TRIP-B2-001", boat_unit_id: BOAT_2,
        lines: [
            {
                sku_id: "whole-snapper", amount: 100, event_type: "transfer_initiated",
                location_id: LOC_K, unit_id: BOAT_2
            },
            {
                sku_id: "whole-snapper", amount: 100, event_type: "transfer_received",
                location_id: LOC_K, unit_id: HUB, unit_cost: 50000
            },
            {
                sku_id: "whole-grouper", amount: 50, event_type: "transfer_initiated",
                location_id: LOC_K, unit_id: BOAT_2
            },
            {
                sku_id: "whole-grouper", amount: 50, event_type: "transfer_received",
                location_id: LOC_K, unit_id: HUB, unit_cost: 70000
            },
        ],
    });

    check("Hub snapper total", (await inv(LOC_K, HUB, "whole-snapper"))?.current_balance, 250);
    check("Hub grouper total", (await inv(LOC_K, HUB, "whole-grouper"))?.current_balance, 50);
    check("Boat1 empty", (await inv(LOC_K, BOAT_1, "whole-snapper"))?.current_balance, 0);
    check("Boat2 snapper empty", (await inv(LOC_K, BOAT_2, "whole-snapper"))?.current_balance, 0);
    check("Boat2 grouper empty", (await inv(LOC_K, BOAT_2, "whole-grouper"))?.current_balance, 0);

    // ═══ Move to factory ═══
    console.log("\n═══ Move to factory ═══");
    await post({
        document_id: "MOVE-FACTORY-ALL", document_type: "transfer_internal",
        company_id: CO, location_id: LOC_K, unit_id: FACTORY,
        lines: [
            {
                sku_id: "whole-snapper", amount: 250, event_type: "transfer_initiated",
                location_id: LOC_K, unit_id: HUB
            },
            {
                sku_id: "whole-snapper", amount: 250, event_type: "transfer_received",
                location_id: LOC_K, unit_id: FACTORY, unit_cost: 47000
            },
        ],
    });

    check("Factory snapper", (await inv(LOC_K, FACTORY, "whole-snapper"))?.current_balance, 250);

    // ═══ Factory processes batch ═══
    console.log("\n═══ Factory processes 250kg snapper ═══");
    // 250kg → 110kg fillet + 15kg roe + 125kg waste
    await post({
        document_id: "PROC-MULTI-001", document_type: "inventory_transformation",
        company_id: CO, location_id: LOC_K, unit_id: FACTORY,
        batch_id: "BATCH-MULTI-001", operator_id: "OP-Ahmad",
        factory_unit_id: FACTORY,
        lines: [
            {
                sku_id: "whole-snapper", amount: 250, event_type: "transformation_out",
                location_id: LOC_K, unit_id: FACTORY
            },
            {
                sku_id: "snapper-fillet", amount: 110, event_type: "transformation_in",
                location_id: LOC_K, unit_id: FACTORY
            },
            {
                sku_id: "snapper-roe", amount: 15, event_type: "transformation_in",
                location_id: LOC_K, unit_id: FACTORY
            },
            {
                sku_id: "organic-waste", amount: 125, event_type: "transformation_in",
                location_id: LOC_K, unit_id: FACTORY
            },
        ],
    });

    check("Factory fillet", (await inv(LOC_K, FACTORY, "snapper-fillet"))?.current_balance, 110);
    check("Factory roe", (await inv(LOC_K, FACTORY, "snapper-roe"))?.current_balance, 15);

    // ═══ Move to finished goods ═══
    console.log("\n═══ Move to finished goods ═══");
    await post({
        document_id: "MOVE-FIN-ALL", document_type: "transfer_internal",
        company_id: CO, location_id: LOC_K, unit_id: FINISHED,
        lines: [
            {
                sku_id: "snapper-fillet", amount: 110, event_type: "transfer_initiated",
                location_id: LOC_K, unit_id: FACTORY
            },
            {
                sku_id: "snapper-fillet", amount: 110, event_type: "transfer_received",
                location_id: LOC_K, unit_id: FINISHED, unit_cost: 47000
            },
        ],
    });

    // ═══ Inter-location transfer to Sorong ═══
    console.log("\n═══ Transfer to Sorong cold storage ═══");
    await post({
        document_id: "TRANSFER-SR-MULTI", document_type: "transfer_interlocation",
        company_id: CO, location_id: LOC_K, unit_id: FINISHED,
        lines: [
            {
                sku_id: "snapper-fillet", amount: 60, event_type: "transfer_initiated",
                location_id: LOC_K, unit_id: FINISHED
            },
            {
                sku_id: "snapper-fillet", amount: 60, event_type: "transfer_received",
                location_id: LOC_S, unit_id: COLD_S, unit_cost: 47000
            },
        ],
    });

    // ═══ FINAL RECONCILIATION ═══
    console.log("\n═══ FINAL RECONCILIATION ═══");
    const kFillet = (await inv(LOC_K, FINISHED, "snapper-fillet"))?.current_balance || 0;
    const sFillet = (await inv(LOC_S, COLD_S, "snapper-fillet"))?.current_balance || 0;
    check("Kaimana fillet remaining", kFillet, 50);
    check("Sorong fillet received", sFillet, 60);
    check("Total fillet (multi-location)", kFillet + sFillet, 110);

    const docs = await db.collection("documents").get();
    check("Total documents posted", docs.size, 10);

    const batches = await db.collection("processing_batches").get();
    check("Processing batches", batches.size, 1);

    const pending = await db.collection("document_requests").get();
    check("Orphan requests", pending.size, 0);

    console.log("\n══════════════════════════════════════════════════════════════");
    if (errors === 0) {
        console.log("  ✅ ALL CHECKS PASSED — Multi-Boat Scenario Verified");
    } else {
        console.log(`  ❌ ${errors} CHECK(S) FAILED`);
    }
    console.log("══════════════════════════════════════════════════════════════\n");
    process.exit(errors > 0 ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); });
