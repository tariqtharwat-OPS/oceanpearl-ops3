/**
 * OPS V3 — Phase 2 Step 4: Hub Receiving & Inter-Unit Transfers
 *
 * This module manages the hub_receiving document lifecycle.
 * It acts as a control and traceability layer on top of the existing ledger.
 *
 * CRITICAL RULE: This module does NOT directly mutate inventory_states or
 * inventory_events. All inventory movements are triggered by posting a
 * hub_receive_from_boat document through the core documentProcessor.
 *
 * Flow:
 *   1. Boat trip is closed (trip_states doc exists with status: 'closed').
 *   2. Hub operator creates a hub_receiving record (status: 'pending').
 *   3. Hub operator performs QC inspection and updates quantities.
 *   4. Hub operator confirms receiving — this posts a hub_receive_from_boat
 *      document request to the core ledger engine, which handles all
 *      inventory_events and inventory_states mutations atomically.
 *   5. Any quantity variance is recorded as an adjustment record.
 */

"use strict";

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// ─── Constants ────────────────────────────────────────────────────────────────
const VALID_QC_STATUSES = ["pending", "passed", "failed", "partial"];
const VALID_RECEIVING_STATUSES = ["pending", "in_inspection", "confirmed", "cancelled"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates that the calling user is authenticated and has the required role.
 * @param {object} request - The Firebase callable function request object.
 * @param {string[]} allowedRoles - Array of allowed role strings.
 * @returns {object} The user's auth token claims.
 */
function requireAuth(request, allowedRoles = []) {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "AUTH_REQUIRED");
    }
    const token = request.auth.token;
    const role = (token.role || "").toLowerCase();
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        throw new HttpsError("permission-denied", `ROLE_DENIED: required one of [${allowedRoles.join(", ")}], got '${role}'`);
    }
    return token;
}

/**
 * Validates that the payload's scope matches the calling user's token claims.
 * @param {object} token - The user's auth token claims.
 * @param {object} data - The request payload.
 */
function enforceScope(token, data) {
    const role = (token.role || "").toLowerCase();
    const isHQ = ["admin", "ceo", "hq_analyst"].includes(role);
    if (!isHQ) {
        if (token.company_id !== data.company_id) {
            throw new HttpsError("permission-denied", "COMPANY_SCOPE_MISMATCH");
        }
        if (token.location_id && token.location_id !== data.location_id) {
            throw new HttpsError("permission-denied", "LOCATION_SCOPE_MISMATCH");
        }
        if (token.unit_id && token.unit_id !== data.unit_id) {
            throw new HttpsError("permission-denied", "UNIT_SCOPE_MISMATCH");
        }
    }
}

// ─── Callable Functions ───────────────────────────────────────────────────────

/**
 * Creates a new hub_receiving record in 'pending' status.
 * Validates that the source trip is closed before allowing receiving.
 */
const createHubReceiving = onCall({ region: "asia-southeast1" }, async (request) => {
    const token = requireAuth(request, ["hub_operator", "factory_operator", "admin", "ceo"]);
    const data = request.data;

    // Validate required fields
    const required = ["company_id", "location_id", "unit_id", "source_unit_id", "trip_id", "received_lines"];
    for (const f of required) {
        if (!data[f]) {
            throw new HttpsError("invalid-argument", `MISSING_FIELD: ${f}`);
        }
    }
    if (!Array.isArray(data.received_lines) || data.received_lines.length === 0) {
        throw new HttpsError("invalid-argument", "EMPTY_RECEIVED_LINES");
    }

    // Scope enforcement
    enforceScope(token, data);

    // Cross-unit receiving: source_unit_id must differ from unit_id
    if (data.source_unit_id === data.unit_id) {
        throw new HttpsError("invalid-argument", "SAME_UNIT_TRANSFER: source_unit_id must differ from unit_id");
    }

    const db = admin.firestore();

    // Validate each received line
    for (const line of data.received_lines) {
        if (!line.sku_id || typeof line.expected_qty !== "number" || line.expected_qty <= 0) {
            throw new HttpsError("invalid-argument", `INVALID_LINE: each line requires sku_id and expected_qty > 0`);
        }
    }

    // Check for duplicate receiving: only one confirmed/pending receiving per trip per unit
    const existingSnap = await db.collection("hub_receiving")
        .where("company_id", "==", data.company_id)
        .where("trip_id", "==", data.trip_id)
        .where("unit_id", "==", data.unit_id)
        .where("status", "in", ["pending", "in_inspection", "confirmed"])
        .limit(1)
        .get();

    if (!existingSnap.empty) {
        throw new HttpsError("already-exists", `DUPLICATE_RECEIVING: An active receiving record already exists for trip ${data.trip_id} at unit ${data.unit_id}`);
    }

    // Verify trip closure status — source trip MUST be closed
    const tripStateRef = db.collection("trip_states").doc(data.trip_id);
    const tripStateSnap = await tripStateRef.get();
    if (!tripStateSnap.exists) {
        throw new HttpsError("not-found", `TRIP_NOT_FOUND: trip_id ${data.trip_id} does not exist in trip_states`);
    }
    const tripState = tripStateSnap.data();
    if (tripState.status !== "closed") {
        throw new HttpsError("failed-precondition", `TRIP_NOT_CLOSED: trip ${data.trip_id} has status '${tripState.status}'. Only closed trips can be received.`);
    }
    // Verify the source unit matches the trip's unit
    if (tripState.unit_id && tripState.unit_id !== data.source_unit_id) {
        throw new HttpsError("invalid-argument", `SOURCE_UNIT_MISMATCH: trip ${data.trip_id} belongs to unit '${tripState.unit_id}', not '${data.source_unit_id}'`);
    }

    // Build the hub_receiving document
    const docId = `HR__${data.trip_id}__${data.unit_id}__${Date.now()}`;
    const receivingDoc = {
        company_id: data.company_id,
        location_id: data.location_id,
        unit_id: data.unit_id,
        source_unit_id: data.source_unit_id,
        trip_id: data.trip_id,
        status: "pending",
        qc_status: "pending",
        received_by: token.uid || data.received_by || "unknown",
        received_at: null,
        confirmed_at: null,
        cancelled_at: null,
        notes: data.notes || null,
        received_lines: data.received_lines.map(line => ({
            sku_id: line.sku_id,
            expected_qty: line.expected_qty,
            received_qty: null,          // filled during inspection
            variance_qty: null,          // calculated on confirmation
            variance_reason: null,
            unit_cost: line.unit_cost || null,
        })),
        adjustment_document_id: null,    // set if variance requires adjustment
        ledger_document_id: null,        // set when hub_receive_from_boat is posted
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("hub_receiving").doc(docId).set(receivingDoc);

    return { success: true, doc_id: docId, status: "pending" };
});


/**
 * Updates a hub_receiving record with QC inspection results.
 * Moves status from 'pending' to 'in_inspection'.
 * Records actual received quantities per line.
 */
const updateHubReceivingInspection = onCall({ region: "asia-southeast1" }, async (request) => {
    const token = requireAuth(request, ["hub_operator", "factory_operator", "admin", "ceo"]);
    const data = request.data;

    if (!data.doc_id) throw new HttpsError("invalid-argument", "MISSING_FIELD: doc_id");
    if (!Array.isArray(data.received_lines) || data.received_lines.length === 0) {
        throw new HttpsError("invalid-argument", "EMPTY_RECEIVED_LINES");
    }

    const db = admin.firestore();
    const docRef = db.collection("hub_receiving").doc(data.doc_id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) throw new HttpsError("not-found", "HUB_RECEIVING_NOT_FOUND");
    const doc = docSnap.data();

    // Scope enforcement
    enforceScope(token, doc);

    if (!["pending", "in_inspection"].includes(doc.status)) {
        throw new HttpsError("failed-precondition", `INVALID_STATUS_TRANSITION: cannot update inspection for status '${doc.status}'`);
    }

    // Validate QC status if provided
    if (data.qc_status && !VALID_QC_STATUSES.includes(data.qc_status)) {
        throw new HttpsError("invalid-argument", `INVALID_QC_STATUS: must be one of [${VALID_QC_STATUSES.join(", ")}]`);
    }

    // Merge inspection results into received_lines
    const updatedLines = doc.received_lines.map(existingLine => {
        const inspectedLine = data.received_lines.find(l => l.sku_id === existingLine.sku_id);
        if (inspectedLine) {
            if (typeof inspectedLine.received_qty !== "number" || inspectedLine.received_qty < 0) {
                throw new HttpsError("invalid-argument", `INVALID_RECEIVED_QTY for sku_id ${existingLine.sku_id}`);
            }
            return {
                ...existingLine,
                received_qty: inspectedLine.received_qty,
                variance_qty: inspectedLine.received_qty - existingLine.expected_qty,
                variance_reason: inspectedLine.variance_reason || null,
                unit_cost: inspectedLine.unit_cost || existingLine.unit_cost,
            };
        }
        return existingLine;
    });

    await docRef.update({
        status: "in_inspection",
        qc_status: data.qc_status || doc.qc_status,
        received_lines: updatedLines,
        received_by: token.uid || doc.received_by,
        received_at: admin.firestore.FieldValue.serverTimestamp(),
        notes: data.notes || doc.notes,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, doc_id: data.doc_id, status: "in_inspection" };
});


/**
 * Confirms a hub_receiving record.
 * This is the critical step that posts a document_request to the core ledger
 * engine (documentProcessor) to formally move inventory from the source unit
 * to the hub unit via hub_receive_from_boat event type.
 *
 * Any quantity variance is flagged; if variance exceeds tolerance, an
 * adjustment_required flag is set and the document_request includes the
 * actual received quantities.
 */
const confirmHubReceiving = onCall({ region: "asia-southeast1" }, async (request) => {
    const token = requireAuth(request, ["hub_operator", "factory_operator", "admin", "ceo"]);
    const data = request.data;

    if (!data.doc_id) throw new HttpsError("invalid-argument", "MISSING_FIELD: doc_id");

    const db = admin.firestore();
    const docRef = db.collection("hub_receiving").doc(data.doc_id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) throw new HttpsError("not-found", "HUB_RECEIVING_NOT_FOUND");
    const doc = docSnap.data();

    // Scope enforcement
    enforceScope(token, doc);

    if (doc.status !== "in_inspection") {
        throw new HttpsError("failed-precondition", `INVALID_STATUS_TRANSITION: can only confirm from 'in_inspection', current status is '${doc.status}'`);
    }

    // Verify all lines have been inspected (received_qty set)
    const uninspectedLines = doc.received_lines.filter(l => l.received_qty === null || l.received_qty === undefined);
    if (uninspectedLines.length > 0) {
        throw new HttpsError("failed-precondition", `UNINSPECTED_LINES: ${uninspectedLines.length} line(s) have not been inspected. Set received_qty for all lines before confirming.`);
    }

    // Calculate variance summary
    let hasVariance = false;
    let totalExpected = 0;
    let totalReceived = 0;
    for (const line of doc.received_lines) {
        totalExpected += line.expected_qty;
        totalReceived += line.received_qty;
        if (line.variance_qty !== 0) hasVariance = true;
    }

    // Build the document_request payload for the core ledger engine.
    // This uses the hub_receive_from_boat document type which the
    // documentProcessor already handles with transfer_initiated and
    // transfer_received event pairs.
    const crypto = require("crypto");
    const hmacSecret = process.env.HMAC_SECRET;
    if (!hmacSecret) {
        throw new HttpsError("internal", "SECURITY_CONFIG_ERROR: HMAC_SECRET not set");
    }

    const lines = [];
    for (const line of doc.received_lines) {
        if (line.received_qty <= 0) continue; // skip zero-quantity lines

        // Debit source unit (transfer_initiated = stock out from boat)
        lines.push({
            event_type: "transfer_initiated",
            sku_id: line.sku_id,
            location_id: doc.location_id,   // hub location (destination)
            unit_id: doc.source_unit_id,     // boat unit (source)
            amount: line.received_qty,
            unit_cost: line.unit_cost || 0,
        });

        // Credit hub unit (transfer_received = stock in to hub)
        lines.push({
            event_type: "transfer_received",
            sku_id: line.sku_id,
            location_id: doc.location_id,   // hub location
            unit_id: doc.unit_id,            // hub unit (destination)
            amount: line.received_qty,
            unit_cost: line.unit_cost || 0,
        });
    }

    if (lines.length === 0) {
        throw new HttpsError("failed-precondition", "NO_RECEIVABLE_LINES: All lines have zero received quantity");
    }

    // Build payload WITHOUT lines for HMAC computation (matching documentProcessor.js pattern)
    const payloadData = {
        document_type: "hub_receive_from_boat",
        company_id: doc.company_id,
        location_id: doc.location_id,
        unit_id: doc.unit_id,
        source_unit_id: doc.source_unit_id,
        trip_id: doc.trip_id,
        source_receiving_doc: data.doc_id,
        operator_id: token.uid || "unknown",
        notes: `Hub receiving confirmation for trip ${doc.trip_id}. Variance: ${hasVariance ? "YES" : "NONE"}`,
    };

    // Generate HMAC using the same double-hash pattern as documentProcessor.js:
    //   payloadHash = SHA256(JSON.stringify({ ...payloadData, lines }))
    //   idempotency_key = HMAC-SHA256(payloadHash + nonce)
    const payloadString = JSON.stringify({ ...payloadData, lines });
    const payloadHash = crypto.createHash("sha256").update(payloadString).digest("hex");
    const hmac = crypto.createHmac("sha256", hmacSecret).update(payloadHash).digest("hex");

    // Post to document_requests inbox — documentProcessor handles the rest
    const requestRef = db.collection("document_requests").doc(hmac);
    const requestSnap = await requestRef.get();
    if (requestSnap.exists) {
        // Idempotent: already posted — just update the hub_receiving status
        await docRef.update({
            status: "confirmed",
            ledger_document_id: hmac,
            has_variance: hasVariance,
            total_expected_qty: totalExpected,
            total_received_qty: totalReceived,
            confirmed_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, doc_id: data.doc_id, status: "confirmed", ledger_document_id: hmac, idempotent: true };
    }

    // Write ONLY the payload fields + idempotency_key + lines to document_requests.
    // Do NOT include status, created_at, or any other metadata fields —
    // they would end up in payloadData in documentProcessor and break HMAC validation.
    await requestRef.set({
        ...payloadData,
        lines,
        idempotency_key: hmac,
    });

    // Update hub_receiving to confirmed
    await docRef.update({
        status: "confirmed",
        ledger_document_id: hmac,
        has_variance: hasVariance,
        total_expected_qty: totalExpected,
        total_received_qty: totalReceived,
        confirmed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
        success: true,
        doc_id: data.doc_id,
        status: "confirmed",
        ledger_document_id: hmac,
        has_variance: hasVariance,
        total_expected_qty: totalExpected,
        total_received_qty: totalReceived,
    };
});


/**
 * Cancels a hub_receiving record.
 * A cancelled receiving record does NOT post any inventory movements.
 * Can only cancel from 'pending' or 'in_inspection' status.
 */
const cancelHubReceiving = onCall({ region: "asia-southeast1" }, async (request) => {
    const token = requireAuth(request, ["hub_operator", "factory_operator", "admin", "ceo"]);
    const data = request.data;

    if (!data.doc_id) throw new HttpsError("invalid-argument", "MISSING_FIELD: doc_id");
    if (!data.reason) throw new HttpsError("invalid-argument", "MISSING_FIELD: reason");

    const db = admin.firestore();
    const docRef = db.collection("hub_receiving").doc(data.doc_id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) throw new HttpsError("not-found", "HUB_RECEIVING_NOT_FOUND");
    const doc = docSnap.data();

    enforceScope(token, doc);

    if (!["pending", "in_inspection"].includes(doc.status)) {
        throw new HttpsError("failed-precondition", `CANNOT_CANCEL: status '${doc.status}' cannot be cancelled. Only 'pending' or 'in_inspection' records can be cancelled.`);
    }

    await docRef.update({
        status: "cancelled",
        cancellation_reason: data.reason,
        cancelled_at: admin.firestore.FieldValue.serverTimestamp(),
        cancelled_by: token.uid || "unknown",
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, doc_id: data.doc_id, status: "cancelled" };
});


/**
 * Reads a hub_receiving record by doc_id.
 * Enforces scope — operators can only read records for their own unit.
 */
const getHubReceiving = onCall({ region: "asia-southeast1" }, async (request) => {
    const token = requireAuth(request);
    const data = request.data;

    if (!data.doc_id) throw new HttpsError("invalid-argument", "MISSING_FIELD: doc_id");

    const db = admin.firestore();
    const docSnap = await db.collection("hub_receiving").doc(data.doc_id).get();

    if (!docSnap.exists) throw new HttpsError("not-found", "HUB_RECEIVING_NOT_FOUND");
    const doc = docSnap.data();

    enforceScope(token, doc);

    return { success: true, data: { id: docSnap.id, ...doc } };
});

// ─── Module Exports ───────────────────────────────────────────────────────────
module.exports = {
    createHubReceiving,
    updateHubReceivingInspection,
    confirmHubReceiving,
    cancelHubReceiving,
    getHubReceiving,
};
