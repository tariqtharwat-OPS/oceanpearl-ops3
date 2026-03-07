import * as admin from "firebase-admin";
import * as crypto from "crypto";

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.HMAC_SECRET = 'OPS3_PHASE0_DEV_SECRET';

if (!admin.apps.length) {
    admin.initializeApp({ projectId: "ops3-production" });
}
const db = admin.firestore();
const HMAC_SECRET = process.env.HMAC_SECRET!;

function generateHmac(payload: any, nonce: string) {
    const payloadStr = JSON.stringify(payload);
    const hash = crypto.createHash('sha256').update(payloadStr).digest('hex');
    return crypto.createHmac('sha256', HMAC_SECRET).update(hash + nonce).digest('hex');
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function runSimulation() {
    console.log("🚀 Starting Phase 2 Step 1 Simulation: Transformation Ledger");

    const locationId = "Kaimana-Hub";
    const unitId = "Factory-01";
    const companyId = "Ocean-Pearl-SC";

    // 1. Setup Initial Stock: 100kg Whole Snapper
    console.log("--- Step 1: Seeding Initial Whole Snapper Stock ---");
    const seedPayload = {
        document_id: "SEED-TRANS-01",
        document_type: "receiving",
        company_id: companyId,
        location_id: locationId,
        unit_id: unitId,
        lines: [
            {
                sku_id: "whole-snapper",
                amount: 100,
                event_type: "receive_own",
                location_id: locationId,
                unit_id: unitId
            }
        ]
    };
    const sNonce = "seed_" + Date.now();
    const sHmac = generateHmac(seedPayload, sNonce);
    await db.collection("document_requests").doc(sHmac).set({ ...seedPayload, idempotency_key: sHmac, nonce: sNonce });

    await sleep(2000);

    const intialState = await db.collection("inventory_states").doc(`${locationId}__${unitId}__whole-snapper`).get();
    console.log(`Initial Whole Snapper Balance: ${intialState.data()?.current_balance} KG`);

    // 2. Perform Transformation
    // Input: 100kg Whole Snapper
    // Outputs: 40kg Fillet, 5kg Roe, 55kg Waste
    console.log("\n--- Step 2: Executing Transformation ---");
    const transPayload = {
        document_id: "TRANS-BATCH-001",
        document_type: "inventory_transformation",
        company_id: companyId,
        location_id: locationId,
        unit_id: unitId,
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
                amount: 40,
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
            },
            {
                sku_id: "organic-waste",
                amount: 55,
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

    // 3. Verification
    console.log("\n--- Step 3: Verifying Final States ---");

    const snapperState = await db.collection("inventory_states").doc(`${locationId}__${unitId}__whole-snapper`).get();
    const filletState = await db.collection("inventory_states").doc(`${locationId}__${unitId}__snapper-fillet`).get();
    const roeState = await db.collection("inventory_states").doc(`${locationId}__${unitId}__snapper-roe`).get();
    const wasteState = await db.collection("inventory_states").doc(`${locationId}__${unitId}__organic-waste`).get();

    console.log(`Whole Snapper Balance: ${snapperState.data()?.current_balance} KG (Expected: 0)`);
    console.log(`Snapper Fillet Balance: ${filletState.data()?.current_balance} KG (Expected: 40)`);
    console.log(`Snapper Roe Balance: ${roeState.data()?.current_balance} KG (Expected: 5)`);
    console.log(`Organic Waste Balance: ${wasteState.data()?.current_balance} KG (Expected: 55)`);

    const doc = await db.collection("documents").doc(tHmac).get();
    console.log(`Document Status: ${doc.data()?.status} (Expected: posted)`);

    if (snapperState.data()?.current_balance === 0 &&
        filletState.data()?.current_balance === 40 &&
        doc.data()?.status === "posted") {
        console.log("\n✅ SIMULATION SUCCESS: Transformation Ledger Functional");
    } else {
        console.log("\n❌ SIMULATION FAILED: State mismatch detected");
    }
}

runSimulation().catch(console.error);
