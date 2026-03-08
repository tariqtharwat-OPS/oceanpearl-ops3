const admin = require("firebase-admin");
const crypto = require("crypto");

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.HMAC_SECRET = 'OPS3_PHASE0_DEV_SECRET';

if (!admin.apps.length) {
    admin.initializeApp({ projectId: "oceanpearl-ops" });
}
const db = admin.firestore();
const HMAC_SECRET = process.env.HMAC_SECRET;

function generateHmac(payload, nonce) {
    const payloadStr = JSON.stringify(payload);
    const hash = crypto.createHash('sha256').update(payloadStr).digest('hex');
    return crypto.createHmac('sha256', HMAC_SECRET).update(hash + nonce).digest('hex');
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function runSimulation() {
    console.log("🚀 Starting Phase 2 Step 2 Simulation: Processing Batch Structure");

    const locationId = "Kaimana-Hub";
    const unitId = "Factory-01";
    const companyId = "Ocean-Pearl-SC";
    const operatorId = "OP-007";
    const batchId = "BATCH-BETA-02";

    // 1. Setup Initial Stock: 200kg Whole Snapper
    console.log("--- Step 1: Seeding Initial Stock ---");
    const seedPayload = {
        document_id: "SEED-BATCH-02",
        document_type: "receiving",
        company_id: companyId,
        location_id: locationId,
        unit_id: unitId,
        lines: [
            {
                sku_id: "whole-snapper",
                amount: 200,
                event_type: "receive_own",
                location_id: locationId,
                unit_id: unitId,
                unit_cost: 50000
            }
        ]
    };
    const sNonce = "seed_" + Date.now();
    const sHmac = generateHmac(seedPayload, sNonce);
    await db.collection("document_requests").doc(sHmac).set({ ...seedPayload, idempotency_key: sHmac, nonce: sNonce });

    await sleep(2000);

    // 2. Perform Transformation with Batch Metadata
    // Input: 100kg Whole Snapper
    // Outputs: 45kg Fillet, 5kg Roe (Total 50kg output)
    console.log("\n--- Step 2: Executing Transformation with Batch Metadata ---");
    const transPayload = {
        document_id: "TRANS-BATCH-002",
        document_type: "inventory_transformation",
        company_id: companyId,
        location_id: locationId,
        unit_id: unitId,
        batch_id: batchId,
        operator_id: operatorId,
        factory_unit_id: unitId,
        lines: [
            {
                sku_id: "whole-snapper",
                amount: 100,
                event_type: "transformation_out",
                location_id: locationId,
                unit_id: unitId
            },
            {
                sku_id: "snapper-fillet",
                amount: 45,
                event_type: "transformation_in",
                location_id: locationId,
                unit_id: unitId
            },
            {
                sku_id: "snapper-roe",
                amount: 5,
                event_type: "transformation_in",
                location_id: locationId,
                unit_id: unitId
            }
        ]
    };
    const tNonce = "trans_" + Date.now();
    const tHmac = generateHmac(transPayload, tNonce);
    await db.collection("document_requests").doc(tHmac).set({ ...transPayload, idempotency_key: tHmac, nonce: tNonce });

    await sleep(3000);

    // 3. Verification of Processing Batch Document
    console.log("\n--- Step 3: Verifying Processing Batch Record ---");

    const batchDoc = await db.collection("processing_batches").doc(tHmac).get();

    if (!batchDoc.exists) {
        console.error("❌ FAILED: processing_batches document not created");
        process.exit(1);
    }

    const batchData = batchDoc.data();
    console.log(`Batch ID: ${batchData.batch_id} (Expected: ${batchId})`);
    console.log(`Operator ID: ${batchData.operator_id} (Expected: ${operatorId})`);
    console.log(`Input Qty: ${batchData.input_qty} KG (Expected: 100)`);
    console.log(`Output Qty: ${batchData.output_qty} KG (Expected: 50)`);
    console.log(`Yield Ratio: ${batchData.yield_ratio} (Expected: 0.5)`);
    console.log(`Doc Link: ${batchData.document_id} (Expected: ${tHmac})`);
    console.log(`Status: ${batchData.status}`);

    const isMatch = (
        batchData.batch_id === batchId &&
        batchData.operator_id === operatorId &&
        batchData.input_qty === 100 &&
        batchData.output_qty === 50 &&
        batchData.yield_ratio === 0.5 &&
        batchData.document_id === tHmac &&
        batchData.status === "posted"
    );

    if (isMatch) {
        console.log("\n✅ SIMULATION SUCCESS: Processing Batch Structure Functional");
    } else {
        console.log("\n❌ SIMULATION FAILED: Data mismatch detected");
        process.exit(1);
    }
}

runSimulation().catch(err => {
    console.error(err);
    process.exit(1);
});
