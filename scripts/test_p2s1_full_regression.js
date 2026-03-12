const admin = require("firebase-admin");
const crypto = require("crypto");

// Initialize Firebase Admin SDK
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
admin.initializeApp({ projectId: "oceanpearl-ops" });
const db = admin.firestore();

const HMAC_SECRET = process.env.HMAC_SECRET || "OPS3_PHASE0_DEV_SECRET";

function generateHmac(payload, nonce) {
    const payloadString = JSON.stringify(payload);
    const payloadHash = crypto.createHash("sha256").update(payloadString).digest("hex");
    return crypto.createHmac("sha256", HMAC_SECRET).update(payloadHash + (nonce || "")).digest("hex");
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function cleanup() {
    const cols = [
        "inventory_states", "inventory_events", "wallet_states", "wallet_events",
        "document_requests", "idempotency_locks", "trip_states"
    ];
    for (const col of cols) {
        const snap = await db.collection(col).get();
        if (!snap.empty) {
            const batch = db.batch();
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
    }
}

async function runTests() {
    console.log("🚀 STARTING PHASE 2 STEP 1 VERIFICATION & REGRESSION SUITE 🚀\n");
    await cleanup();

    const companyId = "oceanpearl";
    const locationId = "test-loc-1";
    const boatUnitId = "test-boat-1";
    const factoryUnitId = "test-factory-1";
    const tripId = `trip-${Date.now()}`;

    // ============================================================
    // TEST 1: Phase-1 Boat MVP Simulation (Regression)
    // ============================================================
    console.log("--- TEST 1: Phase-1 Boat MVP Simulation (Regression) ---");

    // 1a. Receive Own Catch
    const receivePayload = {
        document_id: "BOAT-REC-01", document_type: "receiving", company_id: companyId, location_id: locationId, unit_id: boatUnitId, trip_id: tripId,
        lines: [{ sku_id: "tuna-raw", amount: 100, event_type: "receive_own", unit_cost: 0, location_id: locationId, unit_id: boatUnitId }]
    };
    const hmac1a = generateHmac(receivePayload, "n1a");
    await db.collection("document_requests").doc(hmac1a).set({ ...receivePayload, idempotency_key: hmac1a, nonce: "n1a" });
    await sleep(2000);
    const stock1a = await db.collection("inventory_states").doc(`${locationId}__${boatUnitId}__tuna-raw`).get();
    if (stock1a.data()?.current_balance !== 100) throw new Error(`❌ REGRESSION FAIL [1a]: Receive Own failed. Expected 100, got ${stock1a.data()?.current_balance}`);
    console.log("  ✅ [1a] receive_own: OK");

    // 1b. Sale Out
    const salePayload = {
        document_id: "BOAT-SALE-01", document_type: "sale", company_id: companyId, location_id: locationId, unit_id: boatUnitId, trip_id: tripId,
        lines: [{ sku_id: "tuna-raw", amount: 30, event_type: "sale_out", location_id: locationId, unit_id: boatUnitId }]
    };
    const hmac1b = generateHmac(salePayload, "n1b");
    await db.collection("document_requests").doc(hmac1b).set({ ...salePayload, idempotency_key: hmac1b, nonce: "n1b" });
    await sleep(2000);
    const stock1b = await db.collection("inventory_states").doc(`${locationId}__${boatUnitId}__tuna-raw`).get();
    if (stock1b.data()?.current_balance !== 70) throw new Error(`❌ REGRESSION FAIL [1b]: Sale Out failed. Expected 70, got ${stock1b.data()?.current_balance}`);
    console.log("  ✅ [1b] sale_out: OK");

    // 1c. Trip Expense
    const expensePayload = {
        document_id: "BOAT-EXP-01", document_type: "expense", company_id: companyId, location_id: locationId, unit_id: boatUnitId, trip_id: tripId,
        lines: [{ wallet_id: "cash-on-hand", payment_amount: 500, payment_event_type: "expense_trip" }]
    };
    const hmac1c = generateHmac(expensePayload, "n1c");
    await db.collection("document_requests").doc(hmac1c).set({ ...expensePayload, idempotency_key: hmac1c, nonce: "n1c" });
    await sleep(2000);
    const wallet1c = await db.collection("wallet_states").doc("cash-on-hand").get();
    if (wallet1c.data()?.current_balance !== -500) throw new Error(`❌ REGRESSION FAIL [1c]: Trip Expense failed. Expected -500, got ${wallet1c.data()?.current_balance}`);
    console.log("  ✅ [1c] expense_trip: OK");

    // 1d. Trip Closure
    const closePayload = {
        document_id: "BOAT-CLOSE-01", document_type: "trip_closure", company_id: companyId, location_id: locationId, unit_id: boatUnitId, trip_id: tripId,
        lines: []
    };
    const hmac1d = generateHmac(closePayload, "n1d");
    await db.collection("document_requests").doc(hmac1d).set({ ...closePayload, idempotency_key: hmac1d, nonce: "n1d" });
    await sleep(2000);
    const tripState = await db.collection("trip_states").doc(tripId).get();
    if (tripState.data()?.status !== "closed") throw new Error(`❌ REGRESSION FAIL [1d]: Trip Closure failed.`);
    console.log("  ✅ [1d] trip_closure: OK");

    // ============================================================
    // TEST 2: Phase-2 Transformation Simulation (New Logic)
    // ============================================================
    console.log("\n--- TEST 2: Phase-2 Transformation Simulation (New Logic) ---");

    // 2a. Seed Factory Stock
    const seedPayload = {
        document_id: "FACT-SEED-01", document_type: "receiving", company_id: companyId, location_id: locationId, unit_id: factoryUnitId,
        lines: [{ sku_id: "tuna-raw", amount: 200, event_type: "receive_buy", unit_cost: 10000, location_id: locationId, unit_id: factoryUnitId }]
    };
    const hmac2a = generateHmac(seedPayload, "n2a");
    await db.collection("document_requests").doc(hmac2a).set({ ...seedPayload, idempotency_key: hmac2a, nonce: "n2a" });
    await sleep(2000);
    console.log("  ✅ [2a] Seeded factory with 200kg tuna-raw @ 10000/kg");

    // 2b. Valid Transformation
    const transPayload = {
        document_id: "FACT-TRANS-01", document_type: "inventory_transformation", company_id: companyId, location_id: locationId, unit_id: factoryUnitId,
        lines: [
            { sku_id: "tuna-raw", amount: 100, event_type: "transformation_out", location_id: locationId, unit_id: factoryUnitId },
            { sku_id: "tuna-fillet", amount: 40, event_type: "transformation_in", location_id: locationId, unit_id: factoryUnitId },
            { sku_id: "tuna-waste", amount: 60, event_type: "transformation_in", location_id: locationId, unit_id: factoryUnitId }
        ]
    };
    const hmac2b = generateHmac(transPayload, "n2b");
    await db.collection("document_requests").doc(hmac2b).set({ ...transPayload, idempotency_key: hmac2b, nonce: "n2b" });
    await sleep(2000);
    const stockFillet = await db.collection("inventory_states").doc(`${locationId}__${factoryUnitId}__tuna-fillet`).get();
    const stockWaste = await db.collection("inventory_states").doc(`${locationId}__${factoryUnitId}__tuna-waste`).get();
    const expectedCost = (100 * 10000) / (40 + 60); // 1,000,000 / 100 = 10000
    if (stockFillet.data()?.avg_cost !== expectedCost || stockWaste.data()?.avg_cost !== expectedCost) throw new Error(`❌ NEW LOGIC FAIL [2b]: WAC incorrect. Expected ${expectedCost}, got ${stockFillet.data()?.avg_cost}`);
    console.log(`  ✅ [2b] Valid Transformation: OK (Derived WAC: ${expectedCost})`);

    // 2c. Insufficient Stock
    const insufficientPayload = {
        document_id: "FACT-TRANS-02", document_type: "inventory_transformation", company_id: companyId, location_id: locationId, unit_id: factoryUnitId,
        lines: [{ sku_id: "tuna-raw", amount: 500, event_type: "transformation_out", location_id: locationId, unit_id: factoryUnitId }]
    };
    const hmac2c = generateHmac(insufficientPayload, "n2c");
    await db.collection("document_requests").doc(hmac2c).set({ ...insufficientPayload, idempotency_key: hmac2c, nonce: "n2c" });
    await sleep(2000);
    const lock2c = await db.collection("idempotency_locks").doc(hmac2c).get();
    if (!lock2c.data()?.error?.includes("STOCK_DEFICIT")) throw new Error(`❌ NEW LOGIC FAIL [2c]: Insufficient stock check failed.`);
    console.log("  ✅ [2c] Insufficient Stock: OK (Blocked with STOCK_DEFICIT)");

    // 2d. Line Order Dependency (FIX VERIFICATION)
    const lineOrderPayload = {
        document_id: "FACT-TRANS-03", document_type: "inventory_transformation", company_id: companyId, location_id: locationId, unit_id: factoryUnitId,
        lines: [
            { sku_id: "tuna-fillet", amount: 200, event_type: "transformation_in", location_id: locationId, unit_id: factoryUnitId }, // This would pass if not for the fix
            { sku_id: "tuna-raw", amount: 150, event_type: "transformation_out", location_id: locationId, unit_id: factoryUnitId } // Only 100 available
        ]
    };
    const hmac2d = generateHmac(lineOrderPayload, "n2d");
    await db.collection("document_requests").doc(hmac2d).set({ ...lineOrderPayload, idempotency_key: hmac2d, nonce: "n2d" });
    await sleep(2000);
    const lock2d = await db.collection("idempotency_locks").doc(hmac2d).get();
    if (!lock2d.data()?.error?.includes("STOCK_DEFICIT")) throw new Error(`❌ FIX FAIL [2d]: Line order dependency bug still exists.`);
    console.log("  ✅ [2d] Line Order Dependency Fix: OK (Blocked with STOCK_DEFICIT)");

    console.log("\n🏆 ALL TESTS PASSED 🏆");
}

runTests().catch(err => {
    console.error("\n🔥🔥🔥 TEST SUITE FAILED 🔥🔥🔥");
    console.error(err.message);
    process.exit(1);
});
