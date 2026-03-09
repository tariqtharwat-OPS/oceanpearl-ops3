/**
 * OPS V3 — Phase 2 Step 3
 * WIP Processing Emulator Test Suite
 *
 * Tests the wipStates callable functions against the Firebase emulator.
 * All tests are self-contained and clean up after themselves.
 *
 * Run: node scripts/test_p2s3_wip_processing.js
 * (Requires: firebase emulators:start --only firestore,functions)
 */

"use strict";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

// IMPORTANT: Must initialize admin BEFORE requiring any module that uses admin internally.
// The wipStates module calls admin.app() on load, so the default app must exist first.
const admin = require("../functions/node_modules/.pnpm/firebase-admin@13.7.0/node_modules/firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({ projectId: "oceanpearl-ops" });
}
const db = admin.firestore();

// ─── Test Utilities ───────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function assert(condition, label, detail = "") {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
        results.push({ label, status: "PASS" });
    } else {
        console.error(`  ❌ ${label}${detail ? ": " + detail : ""}`);
        failed++;
        results.push({ label, status: "FAIL", detail });
    }
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function waitForDoc(collection, docId, field, expectedValue, timeout = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const snap = await db.collection(collection).doc(docId).get();
        if (snap.exists && snap.data()[field] === expectedValue) return snap.data();
        await sleep(300);
    }
    return null;
}

// ─── Seed Helpers ─────────────────────────────────────────────────────────────
const SCOPE = {
    company_id: "OCEANPEARL",
    location_id: "LOC_FACTORY_01",
    unit_id: "UNIT_FACTORY_01",
};

async function seedUser(uid, role, scopeOverride = {}) {
    await db.collection("users").doc(uid).set({
        uid,
        role,
        ...SCOPE,
        ...scopeOverride,
    });
}

async function seedBatch(batchId, status = "in_progress") {
    const ref = db.collection("processing_batches").doc(batchId);
    await ref.set({
        batch_id: batchId,
        ...SCOPE,
        status,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
}

async function seedPostedTransformationDoc(docId) {
    await db.collection("documents").doc(docId).set({
        document_id: docId,
        document_type: "inventory_transformation",
        status: "posted",
        ...SCOPE,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function createWipDirectly(data) {
    const ref = db.collection("wip_states").doc();
    await ref.set({
        ...SCOPE,
        status: "pending",
        stage: "receiving",
        stage_history: [],
        quantity: 100,
        quantity_in: 100,
        quantity_out: null,
        transformation_document_id: null,
        started_at: null,
        completed_at: null,
        cancelled_at: null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        created_by: "test_user",
        ...data,
    });
    return ref.id;
}

async function cleanup() {
    const collections = ["wip_states", "processing_batches", "documents", "users"];
    for (const col of collections) {
        const snap = await db.collection(col).get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
}

// ─── Direct Function Invocation (bypasses HTTP layer) ─────────────────────────
// Since we're testing via Admin SDK directly, we call the module functions
// directly with a mock request object to simulate callable function behavior.
// NOTE: wipStates.js uses require('firebase-admin') internally. Because we
// already called initializeApp() above using the same module instance (via the
// functions node_modules path), the admin.app() call inside wipStates will
// find the initialized app correctly.
const wipModule = require("../functions/lib/wipStates");

function mockRequest(uid, role, data, scopeOverride = {}) {
    return {
        auth: {
            uid,
            token: { role, ...SCOPE, ...scopeOverride },
        },
        data,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────
async function runTests() {
    console.log("\n🚀 OPS V3 — Phase 2 Step 3 WIP Processing Test Suite");
    console.log("=".repeat(60));

    await cleanup();

    // ── Seed base data ────────────────────────────────────────────────────────
    await seedUser("factory_op_01", "factory_operator");
    await seedUser("factory_mgr_01", "factory_manager");
    await seedUser("hq_user_01", "hq_analyst", { location_id: "HQ", unit_id: "HQ" });
    await seedUser("other_unit_op", "factory_operator", { unit_id: "UNIT_OTHER" });
    await seedBatch("BATCH-WIP-01", "in_progress");
    await seedBatch("BATCH-WIP-02", "completed");
    await seedPostedTransformationDoc("TXN-DOC-001");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1 — Valid WIP Creation
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 1] Valid WIP Creation");
    try {
        const result = await wipModule.createWipState.run(mockRequest("factory_op_01", "factory_operator", {
            batch_id: "BATCH-WIP-01",
            ...SCOPE,
            sku_id: "SKU_SNAPPER_RAW",
            quantity: 100,
            stage: "receiving",
            operator_id: "factory_op_01",
        }));
        assert(result.success === true, "[1a] createWipState returns success:true");
        assert(result.doc_id !== undefined, "[1b] createWipState returns a doc_id");
        assert(result.status === "pending", "[1c] Initial status is 'pending'");

        // Verify document was written to Firestore
        const snap = await db.collection("wip_states").doc(result.doc_id).get();
        assert(snap.exists, "[1d] WIP document exists in Firestore");
        assert(snap.data().quantity === 100, "[1e] quantity correctly stored as 100");
        assert(snap.data().stage === "receiving", "[1f] stage correctly stored as 'receiving'");
        assert(snap.data().transformation_document_id === null, "[1g] transformation_document_id is null (not yet linked)");
        assert(snap.data().location_id === SCOPE.location_id, "[1h] location_id scope field is present");
        assert(snap.data().unit_id === SCOPE.unit_id, "[1i] unit_id scope field is present");

        // Store doc_id for subsequent tests
        global.wipDocId1 = result.doc_id;
    } catch (e) {
        assert(false, "[1] createWipState threw an unexpected error", e.message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2 — WIP Stage Progression
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 2] WIP Stage Progression");
    try {
        const result = await wipModule.advanceWipStage.run(mockRequest("factory_op_01", "factory_operator", {
            doc_id: global.wipDocId1,
            new_stage: "sorting",
            quantity_loss: 5,
        }));
        assert(result.success === true, "[2a] advanceWipStage returns success:true");
        assert(result.new_stage === "sorting", "[2b] new_stage is 'sorting'");
        assert(result.quantity === 95, "[2c] quantity reduced to 95 after 5kg loss");

        const snap = await db.collection("wip_states").doc(global.wipDocId1).get();
        assert(snap.data().status === "active", "[2d] status is now 'active'");
        assert(snap.data().stage === "sorting", "[2e] stage updated to 'sorting'");
        assert(snap.data().stage_history.length === 2, "[2f] stage_history has 2 entries");
    } catch (e) {
        assert(false, "[2] advanceWipStage threw an unexpected error", e.message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3 — Backward Stage Progression Rejected
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 3] Backward Stage Progression Rejected");
    try {
        await wipModule.advanceWipStage.run(mockRequest("factory_op_01", "factory_operator", {
            doc_id: global.wipDocId1,
            new_stage: "receiving", // backward
        }));
        assert(false, "[3a] Should have thrown INVALID_STAGE_PROGRESSION");
    } catch (e) {
        assert(e.code === "failed-precondition" && e.message.includes("INVALID_STAGE_PROGRESSION"),
            "[3a] Backward stage progression correctly rejected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4 — WIP Completion with Valid Transformation Document
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 4] WIP Completion with Valid Transformation Document");
    // Advance to processing stage first
    await wipModule.advanceWipStage.run(mockRequest("factory_op_01", "factory_operator", {
        doc_id: global.wipDocId1,
        new_stage: "processing",
    }));
    try {
        const result = await wipModule.completeWipState.run(mockRequest("factory_op_01", "factory_operator", {
            doc_id: global.wipDocId1,
            transformation_document_id: "TXN-DOC-001",
            quantity_out: 88,
        }));
        assert(result.success === true, "[4a] completeWipState returns success:true");
        assert(result.transformation_document_id === "TXN-DOC-001", "[4b] transformation_document_id linked");
        assert(result.quantity_out === 88, "[4c] quantity_out correctly recorded as 88");

        const snap = await db.collection("wip_states").doc(global.wipDocId1).get();
        assert(snap.data().status === "completed", "[4d] status is 'completed'");
        assert(snap.data().transformation_document_id === "TXN-DOC-001", "[4e] transformation_document_id stored in Firestore");
        assert(snap.data().quantity_out === 88, "[4f] quantity_out stored in Firestore");
        assert(snap.data().completed_at !== null, "[4g] completed_at timestamp set");

        // CRITICAL: Verify no inventory mutation occurred
        const invStateSnap = await db.collection("inventory_states")
            .where("unit_id", "==", SCOPE.unit_id).limit(1).get();
        assert(invStateSnap.empty, "[4h] CRITICAL: No inventory_states mutation occurred during WIP completion");
    } catch (e) {
        assert(false, "[4] completeWipState threw an unexpected error", e.message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5 — Completion Without Transformation Document Rejected
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 5] Completion Without Transformation Document Rejected");
    const wipId5 = await createWipDirectly({ batch_id: "BATCH-WIP-01", sku_id: "SKU_TUNA_RAW", stage: "processing", status: "active" });
    try {
        await wipModule.completeWipState.run(mockRequest("factory_op_01", "factory_operator", {
            doc_id: wipId5,
            transformation_document_id: "NON_EXISTENT_DOC",
        }));
        assert(false, "[5a] Should have thrown TRANSFORMATION_NOT_FOUND");
    } catch (e) {
        assert(e.code === "not-found" && e.message.includes("TRANSFORMATION_NOT_FOUND"),
            "[5a] Completion without valid transformation correctly rejected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 6 — Completion with Non-Posted Transformation Document Rejected
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 6] Completion with Non-Posted Transformation Document Rejected");
    await db.collection("documents").doc("TXN-DOC-DRAFT").set({
        document_type: "inventory_transformation",
        status: "draft",
        ...SCOPE,
    });
    try {
        await wipModule.completeWipState.run(mockRequest("factory_op_01", "factory_operator", {
            doc_id: wipId5,
            transformation_document_id: "TXN-DOC-DRAFT",
        }));
        assert(false, "[6a] Should have thrown TRANSFORMATION_NOT_POSTED");
    } catch (e) {
        assert(e.code === "failed-precondition" && e.message.includes("TRANSFORMATION_NOT_POSTED"),
            "[6a] Completion with non-posted transformation correctly rejected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 7 — WIP Cancellation (No Inventory Mutation)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 7] WIP Cancellation — No Inventory Mutation");
    const wipId7 = await createWipDirectly({ batch_id: "BATCH-WIP-01", sku_id: "SKU_GROUPER_RAW", stage: "sorting", status: "active" });
    try {
        const result = await wipModule.cancelWipState.run(mockRequest("factory_op_01", "factory_operator", {
            doc_id: wipId7,
            reason: "Material quality rejected",
        }));
        assert(result.success === true, "[7a] cancelWipState returns success:true");
        assert(result.status === "cancelled", "[7b] status is 'cancelled'");

        const snap = await db.collection("wip_states").doc(wipId7).get();
        assert(snap.data().status === "cancelled", "[7c] status 'cancelled' stored in Firestore");
        assert(snap.data().cancellation_reason === "Material quality rejected", "[7d] cancellation_reason stored");
        assert(snap.data().cancelled_at !== null, "[7e] cancelled_at timestamp set");

        // CRITICAL: Verify no inventory mutation occurred
        const invEventsSnap = await db.collection("inventory_events")
            .where("unit_id", "==", SCOPE.unit_id).limit(1).get();
        assert(invEventsSnap.empty, "[7f] CRITICAL: No inventory_events written during cancellation");
    } catch (e) {
        assert(false, "[7] cancelWipState threw an unexpected error", e.message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 8 — Double Cancellation Rejected
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 8] Double Cancellation Rejected");
    try {
        await wipModule.cancelWipState.run(mockRequest("factory_op_01", "factory_operator", {
            doc_id: wipId7,
        }));
        assert(false, "[8a] Should have thrown ALREADY_CANCELLED");
    } catch (e) {
        assert(e.code === "already-exists" && e.message.includes("ALREADY_CANCELLED"),
            "[8a] Double cancellation correctly rejected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 9 — Cross-Scope Rejection
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 9] Cross-Scope Rejection");
    // Attempt to create a WIP for a different unit
    try {
        await wipModule.createWipState.run(mockRequest("other_unit_op", "factory_operator", {
            batch_id: "BATCH-WIP-01",
            company_id: SCOPE.company_id,
            location_id: SCOPE.location_id,
            unit_id: SCOPE.unit_id, // Trying to write to a unit they don't belong to
            sku_id: "SKU_SNAPPER_RAW",
            quantity: 50,
            stage: "receiving",
        }));
        assert(false, "[9a] Should have thrown UNIT_SCOPE_MISMATCH");
    } catch (e) {
        assert(e.code === "permission-denied" && e.message.includes("UNIT_SCOPE_MISMATCH"),
            "[9a] Cross-unit WIP creation correctly rejected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10 — Cross-Scope Transformation Link Rejected
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 10] Cross-Scope Transformation Link Rejected");
    // Seed a transformation document from a different unit
    await db.collection("documents").doc("TXN-DOC-OTHER-UNIT").set({
        document_type: "inventory_transformation",
        status: "posted",
        company_id: SCOPE.company_id,
        location_id: SCOPE.location_id,
        unit_id: "UNIT_OTHER", // Different unit
    });
    const wipId10 = await createWipDirectly({ batch_id: "BATCH-WIP-01", sku_id: "SKU_MACKEREL_RAW", stage: "processing", status: "active" });
    try {
        await wipModule.completeWipState.run(mockRequest("factory_op_01", "factory_operator", {
            doc_id: wipId10,
            transformation_document_id: "TXN-DOC-OTHER-UNIT",
        }));
        assert(false, "[10a] Should have thrown CROSS_SCOPE_TRANSFORMATION");
    } catch (e) {
        assert(e.code === "permission-denied" && e.message.includes("CROSS_SCOPE_TRANSFORMATION"),
            "[10a] Cross-scope transformation link correctly rejected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 11 — Completed Batch Rejects New WIP
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 11] Completed Batch Rejects New WIP");
    try {
        await wipModule.createWipState.run(mockRequest("factory_op_01", "factory_operator", {
            batch_id: "BATCH-WIP-02", // This batch has status: 'completed'
            ...SCOPE,
            sku_id: "SKU_SNAPPER_RAW",
            quantity: 20,
            stage: "receiving",
        }));
        assert(false, "[11a] Should have thrown BATCH_TERMINAL");
    } catch (e) {
        assert(e.code === "failed-precondition" && e.message.includes("BATCH_TERMINAL"),
            "[11a] WIP creation on completed batch correctly rejected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 12 — Invalid Stage Rejected
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[TEST 12] Invalid Stage Rejected");
    try {
        await wipModule.createWipState.run(mockRequest("factory_op_01", "factory_operator", {
            batch_id: "BATCH-WIP-01",
            ...SCOPE,
            sku_id: "SKU_SNAPPER_RAW",
            quantity: 20,
            stage: "INVALID_STAGE_XYZ",
        }));
        assert(false, "[12a] Should have thrown INVALID_STAGE");
    } catch (e) {
        assert(e.code === "invalid-argument" && e.message.includes("INVALID_STAGE"),
            "[12a] Invalid stage correctly rejected");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 13 — Phase 1 Regression: No Phase-1 Collections Modified by WIP
    // ─────────────────────────────────────────────────────────────────────────
    // Strategy: Record the document count in each Phase-1 collection BEFORE
    // a new WIP operation, then verify the count is UNCHANGED AFTER.
    // This correctly handles a shared emulator that may already have data.
    console.log("\n[TEST 13] Phase-1 Regression: WIP module does not touch Phase-1 collections");
    const phase1Collections = [
        "wallet_events", "wallet_states",
        "inventory_events", "inventory_states",
        "trip_states", "idempotency_locks",
    ];

    // Count documents before the test WIP operation
    const countsBefore = {};
    for (const col of phase1Collections) {
        const snap = await db.collection(col).get();
        countsBefore[col] = snap.size;
    }

    // Perform a complete WIP lifecycle (create → advance → cancel)
    const wipId13 = await wipModule.createWipState.run(mockRequest("factory_op_01", "factory_operator", {
        batch_id: "BATCH-WIP-01",
        ...SCOPE,
        sku_id: "SKU_REGRESSION_CHECK",
        quantity: 10,
        stage: "receiving",
    }));
    await wipModule.advanceWipStage.run(mockRequest("factory_op_01", "factory_operator", {
        doc_id: wipId13.doc_id,
        new_stage: "sorting",
    }));
    await wipModule.cancelWipState.run(mockRequest("factory_op_01", "factory_operator", {
        doc_id: wipId13.doc_id,
        reason: "Regression test cancellation",
    }));

    // Count documents after — must be identical
    let phase1Clean = true;
    for (const col of phase1Collections) {
        const snap = await db.collection(col).get();
        const countAfter = snap.size;
        if (countAfter !== countsBefore[col]) {
            phase1Clean = false;
            assert(false, `[13] Phase-1 collection '${col}' was modified: ${countsBefore[col]} → ${countAfter} docs`);
        }
    }
    if (phase1Clean) {
        assert(true, "[13a] CRITICAL: No Phase-1 collections were modified by any WIP operation");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESULTS SUMMARY
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n" + "=".repeat(60));
    console.log(`📊 RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
    if (failed === 0) {
        console.log("🎉 ALL TESTS PASSED — Phase 2 Step 3 WIP Processing VERIFIED");
    } else {
        console.log("❌ SOME TESTS FAILED — Review above for details");
        process.exit(1);
    }

    await cleanup();
}

runTests().catch(err => {
    console.error("💥 Test suite crashed:", err);
    process.exit(1);
});
