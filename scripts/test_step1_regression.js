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

async function runRegression() {
    console.log("🕵️ Starting Phase 2 Step 1 Regression Test Matrix...");

    const locationId = "Reg-Hub-01";
    const unitId = "Boat-Test-01";
    const companyId = "OP-Global";
    const tripId = "TRIP-REG-001";

    // --- TEST A: Phase 1 Receive Own Still Works ---
    console.log("\n[TEST A] Existing: Receive Own (Phase 1)");
    const recvOwnPayload = {
        document_id: "RECV-OWN-01", document_type: "receiving_own", company_id: companyId, location_id: locationId, unit_id: unitId, trip_id: tripId,
        lines: [{ sku_id: "tuna", amount: 50, event_type: "receive_own", unit_cost: 1000, location_id: locationId, unit_id: unitId }]
    };
    const nonceA = "na";
    const hmacA = generateHmac(recvOwnPayload, nonceA);
    await db.collection("document_requests").doc(hmacA).set({ ...recvOwnPayload, idempotency_key: hmacA, nonce: nonceA });
    await sleep(2000);

    const stockA = await db.collection("inventory_states").doc(`${locationId}__${unitId}__tuna`).get();
    if (stockA.exists && stockA.data().current_balance === 50 && stockA.data().avg_cost === 1000) {
        console.log("✅ Receive Own Verified");
    } else {
        throw new Error("❌ Receive Own Failed Regression");
    }

    // --- TEST B: Existing: Sale Out Still Works ---
    console.log("\n[TEST B] Existing: Sale Out (Phase 1)");
    const salePayload = {
        document_id: "SALE-01", document_type: "sale", company_id: companyId, location_id: locationId, unit_id: unitId, trip_id: tripId,
        lines: [{ sku_id: "tuna", amount: 20, event_type: "sale_out", location_id: locationId, unit_id: unitId }]
    };
    const nonceB = "nb";
    const hmacB = generateHmac(salePayload, nonceB);
    await db.collection("document_requests").doc(hmacB).set({ ...salePayload, idempotency_key: hmacB, nonce: nonceB });
    await sleep(2000);

    const stockB = await db.collection("inventory_states").doc(`${locationId}__${unitId}__tuna`).get();
    if (stockB.data().current_balance === 30) {
        console.log("✅ Sale Out Verified (Decremented correctly)");
    } else {
        throw new Error("❌ Sale Out Failed Regression");
    }

    // --- TEST C: Existing: Trip Closure Still Locks ---
    console.log("\n[TEST C] Existing: Trip Closure Locking (Phase 1)");
    const closePayload = {
        document_id: "CLOSE-01", document_type: "trip_closure", company_id: companyId, location_id: locationId, unit_id: unitId, trip_id: tripId,
        lines: []
    };
    const nonceC = "nc";
    const hmacC = generateHmac(closePayload, nonceC);
    await db.collection("document_requests").doc(hmacC).set({ ...closePayload, idempotency_key: hmacC, nonce: nonceC });
    await sleep(2000);

    const tripState = await db.collection("trip_states").doc(tripId).get();
    if (tripState.data().status === "closed") {
        console.log("✅ Trip Closed");

        // Attempt post after closure
        const latePayload = {
            document_id: "LATE-01", document_type: "sale", company_id: companyId, location_id: locationId, unit_id: unitId, trip_id: tripId,
            lines: [{ sku_id: "tuna", amount: 1, event_type: "sale_out", location_id: locationId, unit_id: unitId }]
        };
        const hmacD = generateHmac(latePayload, "nd");
        await db.collection("document_requests").doc(hmacD).set({ ...latePayload, idempotency_key: hmacD, nonce: "nd" });
        await sleep(2000);

        const lockD = await db.collection("idempotency_locks").doc(hmacD).get();
        if (lockD.data().status === "FAILED" && lockD.data().error.includes("TRIP_CLOSED")) {
            console.log("✅ Post-closure write correctly blocked");
        } else {
            throw new Error("❌ Trip Closure Regression Failed: Post-closure write was allowed or wrong error");
        }
    } else {
        throw new Error("❌ Trip Closure Failed");
    }

    // --- TEST D: New Transformation Without Affecting Others ---
    console.log("\n[TEST D] New: Transformation Logic Verification");
    // New unit for clean test
    const unit2 = "Factory-Reg-01";
    // Seed
    const seedP = {
        document_id: "SEED-2", document_type: "receiving", company_id: companyId, location_id: locationId, unit_id: unit2,
        lines: [{ sku_id: "raw-fish", amount: 100, event_type: "receive_own", unit_cost: 5000, location_id: locationId, unit_id: unit2 }]
    };
    const hSeed = generateHmac(seedP, "ns");
    await db.collection("document_requests").doc(hSeed).set({ ...seedP, idempotency_key: hSeed, nonce: "ns" });
    await sleep(2000);

    // Transform
    const transP = {
        document_id: "TRANS-REG-1", document_type: "inventory_transformation", company_id: companyId, location_id: locationId, unit_id: unit2,
        lines: [
            { sku_id: "raw-fish", amount: 100, event_type: "transformation_out", location_id: locationId, unit_id: unit2 },
            { sku_id: "fillet-A", amount: 40, event_type: "transformation_in", location_id: locationId, unit_id: unit2 },
            { sku_id: "fillet-B", amount: 40, event_type: "transformation_in", location_id: locationId, unit_id: unit2 }
        ]
    };
    // Expected cost: (100 * 5000) / 80 = 500000 / 80 = 6250 per kg
    const hTrans = generateHmac(transP, "nt");
    await db.collection("document_requests").doc(hTrans).set({ ...transP, idempotency_key: hTrans, nonce: "nt" });
    await sleep(2000);

    const stockFillet = await db.collection("inventory_states").doc(`${locationId}__${unit2}__fillet-A`).get();
    if (stockFillet.data().current_balance === 40 && stockFillet.data().avg_cost === 6250) {
        console.log("✅ Transformation WAC Redistribution Verified: Cost = 6250");
    } else {
        throw new Error(`❌ Transformation Failed! Found balance ${stockFillet.data().current_balance}, cost ${stockFillet.data().avg_cost}`);
    }

    console.log("\n🏆 ALL REGRESSION TESTS PASSED.");
}

runRegression().catch(err => {
    console.error(err.message);
    process.exit(1);
});
