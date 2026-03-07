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

async function runTests() {
    console.log("🛠 Starting Phase 2 Step 1 Industrial Verification...");

    const locationId = "Indo-Hub-01";
    const unitId = "Factory-A";
    const companyId = "OP-Global";

    // --- TEST 1: Happy Path Transformation ---
    console.log("\n[TEST 1] Happy Path Transformation");
    // Seed stock
    const seedId = "SEED-" + Date.now();
    const seedPayload = {
        document_id: seedId, document_type: "receiving", company_id: companyId, location_id: locationId, unit_id: unitId,
        lines: [{ sku_id: "raw-fish", amount: 100, event_type: "receive_own", unit_cost: 2000, location_id: locationId, unit_id: unitId }]
    };
    const sNonce = "n1";
    await db.collection("document_requests").doc(generateHmac(seedPayload, sNonce)).set({ ...seedPayload, idempotency_key: generateHmac(seedPayload, sNonce), nonce: sNonce });
    await sleep(2000);

    const transId = "TRANS-HAPPY-" + Date.now();
    const transPayload = {
        document_id: transId, document_type: "inventory_transformation", company_id: companyId, location_id: locationId, unit_id: unitId,
        lines: [
            { sku_id: "raw-fish", amount: 50, event_type: "transformation_out", location_id: locationId, unit_id: unitId },
            { sku_id: "fillet", amount: 20, event_type: "transformation_in", location_id: locationId, unit_id: unitId }
        ]
    };
    const tNonce = "n2";
    const tHmac = generateHmac(transPayload, tNonce);
    await db.collection("document_requests").doc(tHmac).set({ ...transPayload, idempotency_key: tHmac, nonce: tNonce });
    await sleep(2000);

    const stockRaw = await db.collection("inventory_states").doc(`${locationId}__${unitId}__raw-fish`).get();
    const stockFillet = await db.collection("inventory_states").doc(`${locationId}__${unitId}__fillet`).get();
    if (stockRaw.data().current_balance === 50 && stockFillet.data().current_balance === 20) {
        console.log("✅ Happy path passed");
    } else {
        console.error("❌ Happy path failed stock mismatch", stockRaw.data(), stockFillet.data());
    }

    // --- TEST 2: Insufficient Stock Rejection ---
    console.log("\n[TEST 2] Insufficient Stock Rejection");
    const failPayload = {
        document_id: "TRANS-FAIL-" + Date.now(), document_type: "inventory_transformation", company_id: companyId, location_id: locationId, unit_id: unitId,
        lines: [{ sku_id: "raw-fish", amount: 1000, event_type: "transformation_out", location_id: locationId, unit_id: unitId }]
    };
    const fNonce = "n3";
    const fHmac = generateHmac(failPayload, fNonce);
    await db.collection("document_requests").doc(fHmac).set({ ...failPayload, idempotency_key: fHmac, nonce: fNonce });
    await sleep(2000);

    const lock = await db.collection("idempotency_locks").doc(fHmac).get();
    if (lock.exists && lock.data().status === "FAILED" && lock.data().error.includes("STOCK_DEFICIT")) {
        console.log("✅ Insufficient stock correctly rejected and logged");
    } else {
        console.error("❌ Test failed: No error or wrong error", lock.data());
    }

    // --- TEST 3: Idempotency Replay ---
    console.log("\n[TEST 3] Idempotency Replay Rejection");
    // Reusing tHmac from Test 1
    await db.collection("document_requests").doc("REPLAY-" + Date.now()).set({ ...transPayload, idempotency_key: tHmac, nonce: tNonce });
    await sleep(1000);
    // Request should be deleted but lock should stay COMPLETED
    const replayReq = await db.collection("document_requests").limit(1).where("idempotency_key", "==", tHmac).get();
    if (replayReq.empty) {
        console.log("✅ Replay attempt removed safely");
    } else {
        console.error("❌ Replay attempt still in inbox");
    }

    // --- TEST 4: Malformed Line Transactional Rollback ---
    console.log("\n[TEST 4] Malformed Line Transactional Rollback");
    const malPayload = {
        document_id: "TRANS-MAL-" + Date.now(), document_type: "inventory_transformation", company_id: companyId, location_id: locationId, unit_id: unitId,
        lines: [
            { sku_id: "raw-fish", amount: 10, event_type: "transformation_out", location_id: locationId, unit_id: unitId },
            { sku_id: "fillet", amount: null, event_type: "transformation_in", location_id: locationId, unit_id: unitId } // Malformed
        ]
    };
    const mNonce = "n4";
    const mHmac = generateHmac(malPayload, mNonce);

    // Check initial raw-fish balance
    const preRaw = (await db.collection("inventory_states").doc(`${locationId}__${unitId}__raw-fish`).get()).data().current_balance;

    await db.collection("document_requests").doc(mHmac).set({ ...malPayload, idempotency_key: mHmac, nonce: mNonce });
    await sleep(2000);

    const postRaw = (await db.collection("inventory_states").doc(`${locationId}__${unitId}__raw-fish`).get()).data().current_balance;
    const mLock = await db.collection("idempotency_locks").doc(mHmac).get();

    if (preRaw === postRaw && mLock.data().status === "FAILED") {
        console.log("✅ Transactional rollback successful: No lines committed");
    } else {
        console.error("❌ Rollback failed! State partially updated", { preRaw, postRaw, status: mLock.data().status });
    }

    console.log("\n🚀 Verification Completed.");
}

runTests().catch(console.error);
