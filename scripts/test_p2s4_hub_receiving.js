/**
 * OPS V3 — Phase 2 Step 4: Hub Receiving Test Suite
 *
 * Tests run against the Firestore + Functions emulator.
 * Requires: firebase emulators:start --only firestore,functions
 *
 * Coverage:
 *   T01 — Valid hub receiving creation
 *   T02 — Receiving from non-closed trip is rejected
 *   T03 — Cross-unit receiving rejected (source_unit_id == unit_id)
 *   T04 — Duplicate receiving prevention
 *   T05 — Inspection update (quantities + QC status)
 *   T06 — Confirmation posts document_request to ledger inbox
 *   T07 — Confirmation with quantity variance is flagged
 *   T08 — Cancellation from pending status
 *   T09 — Cancellation from in_inspection status
 *   T10 — Cannot cancel a confirmed receiving
 *   T11 — Cannot confirm without inspecting all lines
 *   T12 — Idempotent confirmation (same HMAC = no duplicate)
 *   T13 — Phase-1 regression: no mutations to Phase-1 collections
 */

"use strict";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FUNCTIONS_EMULATOR_HOST = "127.0.0.1:5001";
process.env.HMAC_SECRET = "ops3-emulator-test-secret";

// IMPORTANT: Must use the same firebase-admin instance as the modules.
// Require from the functions node_modules to ensure a single shared instance.
const admin = require("../functions/node_modules/.pnpm/firebase-admin@13.7.0/node_modules/firebase-admin");
if (!admin.apps.length) {
    admin.initializeApp({ projectId: "oceanpearl-ops" });
}
const db = admin.firestore();

// Load the hubReceiving module AFTER admin is initialized so admin.app() resolves correctly
const hubReceiving = require("../functions/lib/hubReceiving");

// ─── Test Harness ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function assert(label, condition, detail = "") {
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

function makeRequest(data, role = "hub_operator", uid = "test-hub-op-001") {
    return {
        auth: {
            uid,
            token: {
                uid,
                role,
                company_id: "OCEAN_PEARL",
                location_id: "LOC_HUB_01",
                unit_id: "UNIT_HUB_01",
            },
        },
        data,
    };
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function clearEmulatorData() {
    try {
        const { default: fetch } = await import("node-fetch");
        await fetch(
            `http://127.0.0.1:8080/emulator/v1/projects/oceanpearl-ops/databases/(default)/documents`,
            { method: "DELETE" }
        );
    } catch (e) {
        // node-fetch may not be available — use a manual clear instead
        const collections = ["hub_receiving", "trip_states", "document_requests"];
        for (const col of collections) {
            const snap = await db.collection(col).limit(500).get();
            const batch = db.batch();
            snap.docs.forEach(d => batch.delete(d.ref));
            if (!snap.empty) await batch.commit();
        }
    }
}

// ─── Seed Helpers ─────────────────────────────────────────────────────────────

async function seedClosedTrip(tripId, sourceUnitId = "UNIT_BOAT_01") {
    await db.collection("trip_states").doc(tripId).set({
        status: "closed",
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: sourceUnitId,
        closed_at: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function seedOpenTrip(tripId, sourceUnitId = "UNIT_BOAT_02") {
    await db.collection("trip_states").doc(tripId).set({
        status: "active",
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: sourceUnitId,
    });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {
    console.log("\n🚀 Phase 2 Step 4 — Hub Receiving Test Suite\n");

    // Count Phase-1 collection sizes before tests for regression check
    const p1Collections = ["wallet_events", "inventory_events", "wallet_states", "inventory_states", "trip_states"];
    const p1CountsBefore = {};
    for (const col of p1Collections) {
        const snap = await db.collection(col).count().get();
        p1CountsBefore[col] = snap.data().count;
    }

    // ─── T01: Valid hub receiving creation ────────────────────────────────────
    console.log("T01 — Valid hub receiving creation");
    await seedClosedTrip("TRIP-HUB-T01", "UNIT_BOAT_01");
    let result;
    try {
        result = await hubReceiving.createHubReceiving.run(makeRequest({
            company_id: "OCEAN_PEARL",
            location_id: "LOC_HUB_01",
            unit_id: "UNIT_HUB_01",
            source_unit_id: "UNIT_BOAT_01",
            trip_id: "TRIP-HUB-T01",
            received_lines: [
                { sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 100, unit_cost: 2.0 },
                { sku_id: "SKU_GROUPER_WHOLE", expected_qty: 50, unit_cost: 3.5 },
            ],
            notes: "T01 test receiving",
        }));
        assert("T01a: createHubReceiving returns success", result.success === true);
        assert("T01b: doc_id is returned", typeof result.doc_id === "string" && result.doc_id.length > 0);
        assert("T01c: initial status is 'pending'", result.status === "pending");

        const docSnap = await db.collection("hub_receiving").doc(result.doc_id).get();
        assert("T01d: document exists in Firestore", docSnap.exists);
        const doc = docSnap.data();
        assert("T01e: company_id correct", doc.company_id === "OCEAN_PEARL");
        assert("T01f: trip_id correct", doc.trip_id === "TRIP-HUB-T01");
        assert("T01g: received_lines has 2 entries", doc.received_lines.length === 2);
        assert("T01h: received_qty is null (not yet inspected)", doc.received_lines[0].received_qty === null);
        assert("T01i: ledger_document_id is null (not yet confirmed)", doc.ledger_document_id === null);
    } catch (e) {
        assert("T01: createHubReceiving should not throw", false, e.message);
    }

    // ─── T02: Receiving from non-closed trip rejected ─────────────────────────
    console.log("\nT02 — Receiving from non-closed trip rejected");
    await seedOpenTrip("TRIP-HUB-T02", "UNIT_BOAT_02");
    try {
        await hubReceiving.createHubReceiving.run(makeRequest({
            company_id: "OCEAN_PEARL",
            location_id: "LOC_HUB_01",
            unit_id: "UNIT_HUB_01",
            source_unit_id: "UNIT_BOAT_02",
            trip_id: "TRIP-HUB-T02",
            received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 50 }],
        }));
        assert("T02: Should have thrown TRIP_NOT_CLOSED", false, "No error thrown");
    } catch (e) {
        assert("T02: TRIP_NOT_CLOSED error thrown", e.code === "failed-precondition" && e.message.includes("TRIP_NOT_CLOSED"));
    }

    // ─── T03: Cross-unit receiving rejected (source == destination) ───────────
    console.log("\nT03 — Cross-unit receiving rejected (source_unit_id == unit_id)");
    await seedClosedTrip("TRIP-HUB-T03", "UNIT_HUB_01");
    try {
        await hubReceiving.createHubReceiving.run(makeRequest({
            company_id: "OCEAN_PEARL",
            location_id: "LOC_HUB_01",
            unit_id: "UNIT_HUB_01",
            source_unit_id: "UNIT_HUB_01",  // same as unit_id — invalid
            trip_id: "TRIP-HUB-T03",
            received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 50 }],
        }));
        assert("T03: Should have thrown SAME_UNIT_TRANSFER", false, "No error thrown");
    } catch (e) {
        assert("T03: SAME_UNIT_TRANSFER error thrown", e.code === "invalid-argument" && e.message.includes("SAME_UNIT_TRANSFER"));
    }

    // ─── T04: Duplicate receiving prevention ──────────────────────────────────
    console.log("\nT04 — Duplicate receiving prevention");
    await seedClosedTrip("TRIP-HUB-T04", "UNIT_BOAT_04");
    // First receiving
    await hubReceiving.createHubReceiving.run(makeRequest({
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: "UNIT_HUB_01",
        source_unit_id: "UNIT_BOAT_04",
        trip_id: "TRIP-HUB-T04",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 80 }],
    }));
    // Second receiving for the same trip — should fail
    try {
        await hubReceiving.createHubReceiving.run(makeRequest({
            company_id: "OCEAN_PEARL",
            location_id: "LOC_HUB_01",
            unit_id: "UNIT_HUB_01",
            source_unit_id: "UNIT_BOAT_04",
            trip_id: "TRIP-HUB-T04",
            received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 80 }],
        }));
        assert("T04: Should have thrown DUPLICATE_RECEIVING", false, "No error thrown");
    } catch (e) {
        assert("T04: DUPLICATE_RECEIVING error thrown", e.code === "already-exists" && e.message.includes("DUPLICATE_RECEIVING"));
    }

    // ─── T05: Inspection update ───────────────────────────────────────────────
    console.log("\nT05 — Inspection update (quantities + QC status)");
    await seedClosedTrip("TRIP-HUB-T05", "UNIT_BOAT_05");
    const t05Create = await hubReceiving.createHubReceiving.run(makeRequest({
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: "UNIT_HUB_01",
        source_unit_id: "UNIT_BOAT_05",
        trip_id: "TRIP-HUB-T05",
        received_lines: [
            { sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 100, unit_cost: 2.0 },
        ],
    }));
    try {
        const t05Update = await hubReceiving.updateHubReceivingInspection.run(makeRequest({
            doc_id: t05Create.doc_id,
            qc_status: "passed",
            received_lines: [
                { sku_id: "SKU_SNAPPER_WHOLE", received_qty: 95, variance_reason: "Minor spillage during unloading" },
            ],
        }));
        assert("T05a: updateHubReceivingInspection returns success", t05Update.success === true);
        assert("T05b: status is 'in_inspection'", t05Update.status === "in_inspection");

        const docSnap = await db.collection("hub_receiving").doc(t05Create.doc_id).get();
        const doc = docSnap.data();
        assert("T05c: qc_status updated to 'passed'", doc.qc_status === "passed");
        assert("T05d: received_qty updated to 95", doc.received_lines[0].received_qty === 95);
        assert("T05e: variance_qty calculated as -5", doc.received_lines[0].variance_qty === -5);
    } catch (e) {
        assert("T05: updateHubReceivingInspection should not throw", false, e.message);
    }

    // ─── T06: Confirmation posts document_request ─────────────────────────────
    console.log("\nT06 — Confirmation posts document_request to ledger inbox");
    await seedClosedTrip("TRIP-HUB-T06", "UNIT_BOAT_06");
    const t06Create = await hubReceiving.createHubReceiving.run(makeRequest({
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: "UNIT_HUB_01",
        source_unit_id: "UNIT_BOAT_06",
        trip_id: "TRIP-HUB-T06",
        received_lines: [
            { sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 100, unit_cost: 2.0 },
        ],
    }));
    // Inspect first
    await hubReceiving.updateHubReceivingInspection.run(makeRequest({
        doc_id: t06Create.doc_id,
        qc_status: "passed",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", received_qty: 100 }],
    }));
    // Confirm
    try {
        const t06Confirm = await hubReceiving.confirmHubReceiving.run(makeRequest({ doc_id: t06Create.doc_id }));
        assert("T06a: confirmHubReceiving returns success", t06Confirm.success === true);
        assert("T06b: status is 'confirmed'", t06Confirm.status === "confirmed");
        assert("T06c: ledger_document_id is returned", typeof t06Confirm.ledger_document_id === "string" && t06Confirm.ledger_document_id.length > 0);
        assert("T06d: no variance flagged", t06Confirm.has_variance === false);

        // Verify document_request was posted to the ledger inbox
        const reqSnap = await db.collection("document_requests").doc(t06Confirm.ledger_document_id).get();
        assert("T06e: document_request exists in Firestore", reqSnap.exists);
        const req = reqSnap.data();
        assert("T06f: document_type is hub_receive_from_boat", req.document_type === "hub_receive_from_boat");
        assert("T06g: trip_id is correct", req.trip_id === "TRIP-HUB-T06");
        assert("T06h: lines contain transfer events", Array.isArray(req.lines) && req.lines.length > 0);

        // Verify hub_receiving status updated
        const docSnap = await db.collection("hub_receiving").doc(t06Create.doc_id).get();
        assert("T06i: hub_receiving status is 'confirmed'", docSnap.data().status === "confirmed");
        assert("T06j: ledger_document_id stored on hub_receiving", docSnap.data().ledger_document_id === t06Confirm.ledger_document_id);
    } catch (e) {
        assert("T06: confirmHubReceiving should not throw", false, e.message);
    }

    // ─── T07: Confirmation with quantity variance ──────────────────────────────
    console.log("\nT07 — Confirmation with quantity variance is flagged");
    await seedClosedTrip("TRIP-HUB-T07", "UNIT_BOAT_07");
    const t07Create = await hubReceiving.createHubReceiving.run(makeRequest({
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: "UNIT_HUB_01",
        source_unit_id: "UNIT_BOAT_07",
        trip_id: "TRIP-HUB-T07",
        received_lines: [
            { sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 200, unit_cost: 2.0 },
        ],
    }));
    await hubReceiving.updateHubReceivingInspection.run(makeRequest({
        doc_id: t07Create.doc_id,
        qc_status: "partial",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", received_qty: 175, variance_reason: "Ice melt loss" }],
    }));
    try {
        const t07Confirm = await hubReceiving.confirmHubReceiving.run(makeRequest({ doc_id: t07Create.doc_id }));
        assert("T07a: confirmation succeeds despite variance", t07Confirm.success === true);
        assert("T07b: has_variance is true", t07Confirm.has_variance === true);
        assert("T07c: total_expected_qty is 200", t07Confirm.total_expected_qty === 200);
        assert("T07d: total_received_qty is 175", t07Confirm.total_received_qty === 175);
    } catch (e) {
        assert("T07: confirmHubReceiving with variance should not throw", false, e.message);
    }

    // ─── T08: Cancellation from pending status ────────────────────────────────
    console.log("\nT08 — Cancellation from pending status");
    await seedClosedTrip("TRIP-HUB-T08", "UNIT_BOAT_08");
    const t08Create = await hubReceiving.createHubReceiving.run(makeRequest({
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: "UNIT_HUB_01",
        source_unit_id: "UNIT_BOAT_08",
        trip_id: "TRIP-HUB-T08",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 50 }],
    }));
    try {
        const t08Cancel = await hubReceiving.cancelHubReceiving.run(makeRequest({
            doc_id: t08Create.doc_id,
            reason: "Boat diverted to different hub",
        }));
        assert("T08a: cancelHubReceiving returns success", t08Cancel.success === true);
        assert("T08b: status is 'cancelled'", t08Cancel.status === "cancelled");

        const docSnap = await db.collection("hub_receiving").doc(t08Create.doc_id).get();
        assert("T08c: document status is 'cancelled'", docSnap.data().status === "cancelled");
        assert("T08d: cancellation_reason stored", docSnap.data().cancellation_reason === "Boat diverted to different hub");

        // Verify NO document_request was posted
        const reqSnap = await db.collection("document_requests")
            .where("trip_id", "==", "TRIP-HUB-T08")
            .limit(1).get();
        assert("T08e: NO document_request posted on cancellation", reqSnap.empty);
    } catch (e) {
        assert("T08: cancelHubReceiving should not throw", false, e.message);
    }

    // ─── T09: Cancellation from in_inspection status ──────────────────────────
    console.log("\nT09 — Cancellation from in_inspection status");
    await seedClosedTrip("TRIP-HUB-T09", "UNIT_BOAT_09");
    const t09Create = await hubReceiving.createHubReceiving.run(makeRequest({
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: "UNIT_HUB_01",
        source_unit_id: "UNIT_BOAT_09",
        trip_id: "TRIP-HUB-T09",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 60 }],
    }));
    await hubReceiving.updateHubReceivingInspection.run(makeRequest({
        doc_id: t09Create.doc_id,
        qc_status: "failed",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", received_qty: 0 }],
    }));
    try {
        const t09Cancel = await hubReceiving.cancelHubReceiving.run(makeRequest({
            doc_id: t09Create.doc_id,
            reason: "QC failed — entire catch rejected",
        }));
        assert("T09a: cancelHubReceiving from in_inspection succeeds", t09Cancel.success === true);
        assert("T09b: status is 'cancelled'", t09Cancel.status === "cancelled");
    } catch (e) {
        assert("T09: cancelHubReceiving from in_inspection should not throw", false, e.message);
    }

    // ─── T10: Cannot cancel a confirmed receiving ──────────────────────────────
    console.log("\nT10 — Cannot cancel a confirmed receiving");
    await seedClosedTrip("TRIP-HUB-T10", "UNIT_BOAT_10");
    const t10Create = await hubReceiving.createHubReceiving.run(makeRequest({
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: "UNIT_HUB_01",
        source_unit_id: "UNIT_BOAT_10",
        trip_id: "TRIP-HUB-T10",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 70, unit_cost: 2.0 }],
    }));
    await hubReceiving.updateHubReceivingInspection.run(makeRequest({
        doc_id: t10Create.doc_id,
        qc_status: "passed",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", received_qty: 70 }],
    }));
    await hubReceiving.confirmHubReceiving.run(makeRequest({ doc_id: t10Create.doc_id }));
    try {
        await hubReceiving.cancelHubReceiving.run(makeRequest({
            doc_id: t10Create.doc_id,
            reason: "Trying to cancel after confirmation",
        }));
        assert("T10: Should have thrown CANNOT_CANCEL", false, "No error thrown");
    } catch (e) {
        assert("T10: CANNOT_CANCEL error thrown for confirmed receiving", e.code === "failed-precondition" && e.message.includes("CANNOT_CANCEL"));
    }

    // ─── T11: Cannot confirm without inspecting all lines ─────────────────────
    console.log("\nT11 — Cannot confirm without inspecting all lines");
    await seedClosedTrip("TRIP-HUB-T11", "UNIT_BOAT_11");
    const t11Create = await hubReceiving.createHubReceiving.run(makeRequest({
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: "UNIT_HUB_01",
        source_unit_id: "UNIT_BOAT_11",
        trip_id: "TRIP-HUB-T11",
        received_lines: [
            { sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 100 },
            { sku_id: "SKU_GROUPER_WHOLE", expected_qty: 50 },
        ],
    }));
    // Only inspect one of two lines
    await hubReceiving.updateHubReceivingInspection.run(makeRequest({
        doc_id: t11Create.doc_id,
        qc_status: "passed",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", received_qty: 100 }],
    }));
    try {
        await hubReceiving.confirmHubReceiving.run(makeRequest({ doc_id: t11Create.doc_id }));
        assert("T11: Should have thrown UNINSPECTED_LINES", false, "No error thrown");
    } catch (e) {
        assert("T11: UNINSPECTED_LINES error thrown", e.code === "failed-precondition" && e.message.includes("UNINSPECTED_LINES"));
    }

    // ─── T12: Idempotent confirmation ─────────────────────────────────────────
    console.log("\nT12 — Idempotent confirmation (same HMAC = no duplicate)");
    await seedClosedTrip("TRIP-HUB-T12", "UNIT_BOAT_12");
    const t12Create = await hubReceiving.createHubReceiving.run(makeRequest({
        company_id: "OCEAN_PEARL",
        location_id: "LOC_HUB_01",
        unit_id: "UNIT_HUB_01",
        source_unit_id: "UNIT_BOAT_12",
        trip_id: "TRIP-HUB-T12",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", expected_qty: 80, unit_cost: 2.0 }],
    }));
    await hubReceiving.updateHubReceivingInspection.run(makeRequest({
        doc_id: t12Create.doc_id,
        qc_status: "passed",
        received_lines: [{ sku_id: "SKU_SNAPPER_WHOLE", received_qty: 80 }],
    }));
    const t12Confirm1 = await hubReceiving.confirmHubReceiving.run(makeRequest({ doc_id: t12Create.doc_id }));

    // Manually reset status to 'in_inspection' to simulate a retry
    await db.collection("hub_receiving").doc(t12Create.doc_id).update({ status: "in_inspection" });
    const t12Confirm2 = await hubReceiving.confirmHubReceiving.run(makeRequest({ doc_id: t12Create.doc_id }));

    assert("T12a: Both confirmations return same ledger_document_id", t12Confirm1.ledger_document_id === t12Confirm2.ledger_document_id);
    assert("T12b: Second confirmation is marked idempotent", t12Confirm2.idempotent === true);

    // Verify only ONE document_request exists for this trip
    const t12ReqSnap = await db.collection("document_requests")
        .where("trip_id", "==", "TRIP-HUB-T12")
        .get();
    assert("T12c: Only ONE document_request exists (no duplicate)", t12ReqSnap.size === 1);

    // ─── T13: Phase-1 regression check ───────────────────────────────────────
    console.log("\nT13 — Phase-1 regression: no mutations to Phase-1 collections");
    const p1CountsAfter = {};
    for (const col of p1Collections) {
        // Skip trip_states as we seeded it during tests
        if (col === "trip_states") { p1CountsAfter[col] = p1CountsBefore[col]; continue; }
        const snap = await db.collection(col).count().get();
        p1CountsAfter[col] = snap.data().count;
    }
    const p1Mutated = Object.keys(p1CountsBefore).filter(col => {
        if (col === "trip_states") return false;
        return p1CountsAfter[col] !== p1CountsBefore[col];
    });
    assert("T13: No Phase-1 collections mutated by hub_receiving module", p1Mutated.length === 0,
        p1Mutated.length > 0 ? `Mutated: ${p1Mutated.join(", ")}` : "");

    // ─── Summary ──────────────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(60));
    console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
    if (failed === 0) {
        console.log("🎉 ALL TESTS PASSED — Phase 2 Step 4 Hub Receiving VERIFIED");
    } else {
        console.log("💥 SOME TESTS FAILED — Review failures above");
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error("Fatal test error:", err);
    process.exit(1);
});
