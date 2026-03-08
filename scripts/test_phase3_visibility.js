/**
 * OPS3 — Phase 3 Integrated Visibility & Lineage Simulation
 * 
 * Scenario:
 * 1. Boat KM-01 lands 400kg Snapper (Trip T-100).
 * 2. Hub receives from boat (Doc HUBREC).
 * 3. Factory Proc receives from Hub (Doc FACTPROC).
 * 4. Factory processes batch (Doc BATCH-001).
 *    300kg -> 140kg Fillet + 10kg Roe (Byproduct) + 150kg Organic Waste.
 * 5. Move Fillet to WIP stage (Doc WIP-MOVE).
 * 6. Move Fillet to Finished stage (Doc FIN-MOVE).
 * 7. Transfer to Sorong Cold Store (Doc XFER-SORONG).
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
    const nonce = `phase3_${step}_${Date.now()}`;
    const key = hmac(payload, nonce);
    await db.collection("document_requests").doc(key).set({
        ...payload,
        idempotency_key: key,
        nonce,
    });
    await sleep(4500);
    return key;
}

async function clearEmulator() {
    const cols = ["stock_batch_views", "transfer_views", "stock_views", "processing_batches",
        "documents", "inventory_states", "inventory_events", "wallet_states", "wallet_events",
        "idempotency_locks", "document_requests", "trip_states"];
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
const BOAT = "Boat-KM-01";
const HUB = "Hub-Intake-KM";
const PROC = "Factory-Proc-KM";
const WIP = "Factory-WIP-KM";
const FIN = "Factory-Finished-KM";
const COLD = "ColdStore-SR";
const TRIP = "T-100";

async function run() {
    console.log("══════════════════════════════════════════════════════════════");
    console.log("  OPS3 — Phase 3 HQ Control Layer & Lineage Inheritance");
    console.log("══════════════════════════════════════════════════════════════\n");

    await clearEmulator();
    console.log("✓ Emulator cleared\n");

    // ───────────────────────────────────────────────────────────────────────
    // STEP 1: Boat Landing
    // ───────────────────────────────────────────────────────────────────────
    console.log("═══ Stage 1: Boat Landing (Trip T-100) ═══");
    const catchDocId = await post({
        document_id: "LANDING", document_type: "receiving",
        company_id: CO, location_id: LOC_K, unit_id: BOAT, trip_id: TRIP,
        lines: [{ sku_id: "snapper-whole", amount: 400, event_type: "receive_own", unit_cost: 40000, location_id: LOC_K, unit_id: BOAT }]
    });

    await post({ document_id: "CLOSE-TRIP", document_type: "trip_closure", company_id: CO, location_id: LOC_K, unit_id: BOAT, trip_id: TRIP, lines: [] });

    // ───────────────────────────────────────────────────────────────────────
    // STEP 2: Hub Receive (Automatic Heritage starts here)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ Stage 2: Hub Receive (Lineage from TRIP) ═══");
    const hubRecId = await post({
        document_id: "HUBREC", document_type: "hub_receive_from_boat",
        company_id: CO, location_id: LOC_K, unit_id: HUB,
        source_document_id: catchDocId, // Trigger inheritance
        lines: [
            { sku_id: "snapper-whole", amount: 400, event_type: "transfer_initiated", location_id: LOC_K, unit_id: BOAT },
            { sku_id: "snapper-whole", amount: 400, event_type: "transfer_received", location_id: LOC_K, unit_id: HUB, unit_cost: 40000 }
        ]
    });

    // Verify inheritance in the posted document
    const hLock = await db.collection("idempotency_locks").doc(hubRecId).get();
    if (hLock.exists && hLock.data().status === "FAILED") {
        console.error(`  ❌ Hub Receive FAILED: ${hLock.data().error}`);
        process.exit(1);
    }

    const hubDoc = await db.collection("documents").doc(hubRecId).get();
    if (!hubDoc.exists) {
        console.error(`  ❌ Hub Doc not found: ${hubRecId}`);
        process.exit(1);
    }
    console.log(`  ✓ Hub Doc Heritage: trip_id=${hubDoc.data().lineage?.trip_id} (Expected: ${TRIP})`);

    // ───────────────────────────────────────────────────────────────────────
    // STEP 3: Factory Processing (Heritage from HUB Doc)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ Stage 3: Factory Processing (Batch + Inheritance) ═══");
    const batchId = "BATCH-001";
    const transformId = await post({
        document_id: "TRANSFORM", document_type: "inventory_transformation",
        company_id: CO, location_id: LOC_K, unit_id: PROC,
        source_document_id: hubRecId, // Inherit TRIP lineage
        batch_id: batchId, // Set BATCH lineage
        lines: [
            // Move from Hub to Proc first
            { sku_id: "snapper-whole", amount: 300, event_type: "transformation_out", location_id: LOC_K, unit_id: HUB },
            // Transform in Proc
            { sku_id: "snapper-fillet", amount: 140, event_type: "transformation_in", location_id: LOC_K, unit_id: PROC },
            { sku_id: "snapper-roe-byproduct", amount: 10, event_type: "transformation_in", location_id: LOC_K, unit_id: PROC },
            { sku_id: "organic-waste", amount: 150, event_type: "transformation_in", location_id: LOC_K, unit_id: PROC }
        ]
    });

    // Check KPIs in processing_batches
    const pb = await db.collection("processing_batches").doc(transformId).get();
    const pbData = pb.data();
    console.log("  ✓ Processing Batch KPIs:");
    console.log(`    - Yield Ratio: ${pbData.yield_ratio}`);
    console.log(`    - Waste Ratio: ${pbData.waste_ratio}`);
    console.log(`    - Byproduct Qty: ${pbData.byproduct_qty}`);
    console.log(`    - Heritage: batch_id=${pbData.lineage?.batch_id}, trip_id=${pbData.lineage?.trip_id}`);

    // ───────────────────────────────────────────────────────────────────────
    // STEP 4: WIP Movement (Heritage from TRANSFORM Doc)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ Stage 4: WIP Movement (Auto-Lineage Propagation) ═══");
    await post({
        document_id: "TO-WIP", document_type: "transfer_internal",
        company_id: CO, location_id: LOC_K, unit_id: WIP,
        source_document_id: transformId, // Inherit BATCH + TRIP
        lines: [
            { sku_id: "snapper-fillet", amount: 140, event_type: "transfer_initiated", location_id: LOC_K, unit_id: PROC },
            { sku_id: "snapper-fillet", amount: 140, event_type: "transfer_received", location_id: LOC_K, unit_id: WIP, unit_cost: 40000 }
        ]
    });

    // ───────────────────────────────────────────────────────────────────────
    // STEP 5: Final Transfer (Lineage preserved to HQ)
    // ───────────────────────────────────────────────────────────────────────
    console.log("\n═══ Stage 5: HQ Visibility (Stock Batch Views) ═══");

    const hqStock = await db.collection("stock_batch_views").get();
    console.log("  📊 HQ Stock Batch Report:");
    let foundLineage = false;
    hqStock.forEach(doc => {
        const d = doc.data();
        console.log(`    [${d.unit_id}] ${d.sku_id}: ${d.qty} | Batch: ${d.batch_id} | Trip: ${d.lineage?.trip_id}`);
        if (d.batch_id === batchId && d.lineage?.trip_id === TRIP) foundLineage = true;
    });

    // Check Transfer View
    await post({
        document_id: "XFER-SR", document_type: "transfer_interlocation",
        company_id: CO, location_id: LOC_K, unit_id: FIN,
        source_document_id: transformId, // Still tracking BATCH-001
        lines: [
            { sku_id: "snapper-roe-byproduct", amount: 10, event_type: "transfer_initiated", location_id: LOC_K, unit_id: PROC },
            { sku_id: "snapper-roe-byproduct", amount: 10, event_type: "transfer_received", location_id: LOC_S, unit_id: COLD, unit_cost: 40000 }
        ]
    });

    const transfers = await db.collection("transfer_views").get();
    console.log("\n  🚚 HQ Transfer Monitoring:");
    transfers.forEach(doc => {
        const t = doc.data();
        console.log(`    - ${t.from_location} → ${t.to_location} | Status: ${t.status} | Batch: ${t.lineage?.batch_id}`);
    });

    console.log("\n══════════════════════════════════════════════════════════════");
    if (foundLineage) {
        console.log("  ✅ SUCCESS: Lineage inherited automatically & HQ Views populated");
    } else {
        console.log("  ❌ FAILED: Lineage broke during the chain");
        process.exit(1);
    }
    console.log("══════════════════════════════════════════════════════════════\n");
}

run().catch(e => { console.error(e); process.exit(1); });
