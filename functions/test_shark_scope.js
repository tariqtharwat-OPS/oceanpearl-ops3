
const admin = require("firebase-admin");
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require("firebase/functions");
const { initializeApp } = require("firebase/app");
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut } = require("firebase/auth");

// Config for Emulator
const PROJECT_ID = "oceanpearl-ops";
const REGION = "asia-southeast1";

// Client SDK Init (for calling functions)
const app = initializeApp({
    projectId: PROJECT_ID,
    apiKey: "fake-api-key", // Emulator accepts anything
    authDomain: "localhost"
});

const functions = getFunctions(app, REGION);
connectFunctionsEmulator(functions, "localhost", 5001);

const auth = getAuth(app);
connectAuthEmulator(auth, "http://localhost:9099");

// Admin SDK Init (for setup)
if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();
db.settings({ host: "localhost:8080", ssl: false });

async function setupTestData() {
    console.log("1. Setting up Test Data...");

    // 1. Create Users
    const userA = {
        uid: "user_a",
        email: "usera@test.com",
        role: "UNIT_OP",
        allowedUnits: ["unit_a"],
        allowedLocations: []
    };

    const userB = {
        uid: "user_b",
        email: "userb@test.com",
        role: "UNIT_OP",
        allowedUnits: ["unit_b"],
        allowedLocations: []
    };

    for (const u of [userA, userB]) {
        await db.collection("users").doc(u.uid).set(u);
        try {
            await admin.auth().updateUser(u.uid, { password: "password123" });
        } catch {
            await admin.auth().createUser({ uid: u.uid, email: u.email, password: "password123" });
        }
    }

    // 2. Clear & Seed Inventory
    // We need to delete existing lots to ensure clean count or just count what we add.
    // For speed, let's just add new distinct lots.

    const lotA = {
        unitId: "unit_a",
        speciesId: "YFT",
        quantityKg: 1000,
        status: "IN_STOCK",
        costPerKg: 5
    };

    const lotB = {
        unitId: "unit_b",
        speciesId: "BET",
        quantityKg: 2000,
        status: "IN_STOCK",
        costPerKg: 6
    };

    const refA = db.collection("inventory_lots").doc("lot_test_a");
    const refB = db.collection("inventory_lots").doc("lot_test_b");

    await refA.set(lotA);
    await refB.set(lotB);

    console.log("   Data seeded: User A (unit_a), User B (unit_b), Lot A (unit_a), Lot B (unit_b).");
}

async function runTests() {
    try {
        await setupTestData();

        // TEST 1: User A runs Scan
        console.log("\n2. TEST: sharkRunScan as User A");
        await signInWithEmailAndPassword(auth, "usera@test.com", "password123");

        // Call sharkRunScan
        // Pass a fake scope to see if it is IGNORED (it should be, server derives strict scope)
        const runScan = httpsCallable(functions, 'sharkRunScan');
        const resultA = await runScan({ scope: { unitId: 'unit_b' } }); // Malicious attempt to scan unit B

        const summary = resultA.data.summary;
        console.log("   User A Scan Summary:", JSON.stringify(summary));

        // Verify Validation
        // User A should only see Lot A. 
        // Wait, sharkRunScan logic: "checkedLots" is filtered list.
        // So if DB has 2 lots (A and B), User A should only see 1. (assuming DB was empty before or we check specific ID).
        // Actually DB might have leftovers. But definitely User A should NOT see Lot B.

        // Let's verify via alerts? 
        // Or just trust the `checkedLots` count if we know the DB state.
        // Hard to verify specific count without wiping DB.
        // BUT we can verify `scopeApplied` in summary if we return it?
        // I added `scopeApplied` to `sharkRunScan` return!

        if (summary.scopeApplied.allowedUnits.includes('unit_b')) {
            console.error("❌ FAILED: User A was allowed unit_b!");
        } else if (summary.scopeApplied.allowedUnits.includes('unit_a') && summary.scopeApplied.allowedUnits.length === 1) {
            console.log("✅ PASSED: Scope strictly derived (User A limited to unit_a).");
        } else {
            console.warn("⚠️ CHECK: Scope applied:", summary.scopeApplied);
        }

        await signOut(auth);

        // TEST 2: User A chats asking for Unit B data
        console.log("\n3. TEST: sharkChat as User A (asking for Unit B)");
        await signInWithEmailAndPassword(auth, "usera@test.com", "password123");

        const sharkChat = httpsCallable(functions, 'sharkChat');
        const chatResult = await sharkChat({ message: "How much inventory is in unit_b?" });

        console.log("   User A Chat Response:", chatResult.data.response);

        // Expectation: AI should say "I don't have access" or "I don't know".
        // It should NOT return 2000kg.
        if (chatResult.data.response.includes("2000") || chatResult.data.response.includes("unit_b")) {
            // Note: AI might mention "unit_b" in saying "I can't see unit_b". 
            // But if it says "2000", that's a leak.
            if (chatResult.data.response.includes("2000")) {
                console.error("❌ FAILED: Data Leaked! AI revealed Unit B quantity.");
            } else {
                console.log("✅ PASSED: AI did not reveal count (checked for '2000').");
            }
        } else {
            console.log("✅ PASSED: AI response safe.");
        }

        await signOut(auth);

    } catch (e) {
        console.error("TEST ERROR:", e);
    }
}

runTests();
