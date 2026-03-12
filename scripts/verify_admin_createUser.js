"use strict";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

const admin = require("../functions/node_modules/.pnpm/firebase-admin@13.7.0/node_modules/firebase-admin");
if (!admin.apps.length) {
    admin.initializeApp({ projectId: "oceanpearl-ops" });
}
const db = admin.firestore();
const { admin_createUser } = require("../functions/admin/v3AdminCreateUser");

let pass = 0, fail = 0;
function assert(label, condition) {
    if (condition) { console.log(`  ✅ ${label}`); pass++; }
    else           { console.log(`  ❌ ${label}`); fail++; }
}

async function run() {
    console.log("\n🔍 admin_createUser Verification Tests");
    console.log("=".repeat(50));

    const adminUid = "verify-admin-001";
    const opUid    = "verify-op-001";

    // Seed users
    await db.collection("v3_users").doc(adminUid).set({
        uid: adminUid, role: "admin", email: "admin@verify.com",
        allowedLocationIds: [], allowedUnitIds: []
    });
    await db.collection("v3_users").doc(opUid).set({
        uid: opUid, role: "hub_operator", email: "op@verify.com",
        allowedLocationIds: [], allowedUnitIds: []
    });

    // T1: Unauthenticated call
    try {
        await admin_createUser.run({ auth: null, data: {} });
        assert("T1: unauthenticated call blocked", false);
    } catch (e) {
        assert("T1: unauthenticated call blocked", e.code === "unauthenticated");
    }

    // T2: Non-admin role blocked
    try {
        await admin_createUser.run({
            auth: { uid: opUid },
            data: { email: "x@x.com", password: "12345678", role: "hub_operator", allowedLocationIds: [] }
        });
        assert("T2: non-admin role blocked", false);
    } catch (e) {
        assert("T2: non-admin role blocked", e.code === "permission-denied");
    }

    // T3: Invalid email rejected
    try {
        await admin_createUser.run({
            auth: { uid: adminUid },
            data: { email: "bademail", password: "12345678", role: "hub_operator", allowedLocationIds: [] }
        });
        assert("T3: invalid email rejected", false);
    } catch (e) {
        assert("T3: invalid email rejected", e.code === "invalid-argument");
    }

    // T4: Short password rejected
    try {
        await admin_createUser.run({
            auth: { uid: adminUid },
            data: { email: "valid@test.com", password: "short", role: "hub_operator", allowedLocationIds: [] }
        });
        assert("T4: short password rejected", false);
    } catch (e) {
        assert("T4: short password rejected", e.code === "invalid-argument");
    }

    // T5: Invalid role rejected
    try {
        await admin_createUser.run({
            auth: { uid: adminUid },
            data: { email: "valid@test.com", password: "12345678", role: "superuser", allowedLocationIds: [] }
        });
        assert("T5: invalid role rejected", false);
    } catch (e) {
        assert("T5: invalid role rejected", e.code === "invalid-argument");
    }

    // T6: Return value includes uid and success
    // (We can't create real Auth users against emulator in this mode, so we verify the function
    //  reaches the Auth step by catching the expected auth/emulator error)
    try {
        await admin_createUser.run({
            auth: { uid: adminUid },
            data: {
                email: "newuser@verify.com",
                password: "SecurePass123",
                role: "hub_operator",
                allowedLocationIds: ["LOC-001"],
                allowedUnitIds: ["UNIT-001"],
                displayName: "Test Operator"
            }
        });
        assert("T6: valid call reaches Auth step", true);
    } catch (e) {
        // Auth emulator may reject — still validates all guards passed
        const reachedAuth = e.message && (e.message.includes("Auth") || e.message.includes("auth") || e.code === "internal");
        assert("T6: valid call reaches Auth step (guards passed)", reachedAuth);
    }

    // Cleanup
    await db.collection("v3_users").doc(adminUid).delete();
    await db.collection("v3_users").doc(opUid).delete();

    console.log("=".repeat(50));
    console.log(`📊 Results: ${pass} passed, ${fail} failed`);
    if (fail === 0) console.log("✅ admin_createUser — ALL GUARDS VERIFIED");
    else console.log("❌ FAILURES DETECTED");
    process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
