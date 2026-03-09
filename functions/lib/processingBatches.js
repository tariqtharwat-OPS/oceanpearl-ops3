/**
 * OPS V3 — Processing Batch Management
 * Phase 2 Step 2
 *
 * DESIGN PRINCIPLES:
 * 1. This module is a TRACEABILITY AND CONTROL layer only.
 * 2. It does NOT mutate inventory_states or write inventory_events.
 * 3. All inventory movements continue to occur exclusively through
 *    the verified transformation document pipeline (documentProcessor.js).
 * 4. A processing_batch is a management record that LINKS to one or more
 *    transformation documents. It does not replace them.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { requireAuth, getUserProfile, requireRole, requireLocationScope, requireUnitScope } = require("./auth");

const ALLOWED_STATUSES = ["draft", "in_progress", "completed", "cancelled"];
const FACTORY_ROLES = ["factory_manager", "factory_operator", "admin", "ceo"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Validate scope consistency across all lines
// ─────────────────────────────────────────────────────────────────────────────
function validateLineScopeConsistency(lines, company_id, location_id, unit_id) {
    if (!Array.isArray(lines) || lines.length === 0) return;
    for (const line of lines) {
        if (line.company_id && line.company_id !== company_id) {
            throw new HttpsError("invalid-argument", "CROSS_SCOPE_VIOLATION: All lines must belong to the same company.");
        }
        if (line.location_id && line.location_id !== location_id) {
            throw new HttpsError("invalid-argument", "CROSS_SCOPE_VIOLATION: All lines must belong to the same location.");
        }
        if (line.unit_id && line.unit_id !== unit_id) {
            throw new HttpsError("invalid-argument", "CROSS_SCOPE_VIOLATION: All lines must belong to the same unit.");
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Calculate yield metrics (server-side, never trusted from client)
// ─────────────────────────────────────────────────────────────────────────────
function calculateYield(input_lines, output_lines) {
    const total_input_qty = (input_lines || []).reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
    const total_output_qty = (output_lines || []).reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
    const actual_yield = total_input_qty > 0
        ? parseFloat((total_output_qty / total_input_qty).toFixed(6))
        : 0;
    return { total_input_qty, total_output_qty, actual_yield };
}

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: createProcessingBatch
// Creates a new batch in 'draft' status.
// ─────────────────────────────────────────────────────────────────────────────
exports.createProcessingBatch = onCall({ region: "asia-southeast1" }, async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, FACTORY_ROLES);

    const {
        batch_id, company_id, location_id, unit_id, operator_id,
        input_lines, output_lines, expected_yield, notes
    } = request.data;

    // Validate required fields
    if (!batch_id || !company_id || !location_id || !unit_id) {
        throw new HttpsError("invalid-argument", "MISSING_REQUIRED_FIELDS: batch_id, company_id, location_id, unit_id are required.");
    }

    // Enforce scope: user must be authorized for this location and unit
    requireLocationScope(user, location_id);
    requireUnitScope(user, unit_id);

    // Validate cross-scope consistency of all lines
    validateLineScopeConsistency(input_lines, company_id, location_id, unit_id);
    validateLineScopeConsistency(output_lines, company_id, location_id, unit_id);

    const db = admin.firestore();

    // Prevent duplicate batch_id within the same scope
    const existing = await db.collection("processing_batches")
        .where("batch_id", "==", batch_id)
        .where("company_id", "==", company_id)
        .where("location_id", "==", location_id)
        .where("unit_id", "==", unit_id)
        .limit(1)
        .get();

    if (!existing.empty) {
        throw new HttpsError("already-exists", `DUPLICATE_BATCH_ID: A batch with id '${batch_id}' already exists for this scope.`);
    }

    // Calculate yield server-side (never trust client-submitted yield)
    const { total_input_qty, total_output_qty, actual_yield } = calculateYield(input_lines, output_lines);
    const variance = (expected_yield != null)
        ? parseFloat((actual_yield - Number(expected_yield)).toFixed(6))
        : null;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batchDoc = {
        batch_id,
        company_id,
        location_id,
        unit_id,
        operator_id: operator_id || uid,
        status: "draft",
        started_at: null,
        completed_at: null,
        input_lines: input_lines || [],
        output_lines: output_lines || [],
        expected_yield: expected_yield != null ? Number(expected_yield) : null,
        actual_yield,
        total_input_qty,
        total_output_qty,
        variance,
        transformation_document_ids: [],
        notes: notes || null,
        created_at: now,
        updated_at: now,
        created_by: uid,
    };

    const docRef = db.collection("processing_batches").doc();
    await docRef.set(batchDoc);

    return { success: true, doc_id: docRef.id, batch_id, status: "draft" };
});

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: updateProcessingBatch
// Advances or updates a batch. Enforces lifecycle transitions.
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProcessingBatch = onCall({ region: "asia-southeast1" }, async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, FACTORY_ROLES);

    const { doc_id, status, transformation_document_ids, output_lines, notes } = request.data;

    if (!doc_id) {
        throw new HttpsError("invalid-argument", "MISSING_DOC_ID: doc_id is required.");
    }

    const db = admin.firestore();
    const batchRef = db.collection("processing_batches").doc(doc_id);

    return await db.runTransaction(async (t) => {
        const snap = await t.get(batchRef);
        if (!snap.exists) {
            throw new HttpsError("not-found", "BATCH_NOT_FOUND");
        }

        const current = snap.data();

        // Scope enforcement
        requireLocationScope(user, current.location_id);
        requireUnitScope(user, current.unit_id);

        // Cannot modify a terminal state
        if (current.status === "completed" || current.status === "cancelled") {
            throw new HttpsError("failed-precondition", `TERMINAL_STATE: Batch is already '${current.status}' and cannot be modified.`);
        }

        // Validate lifecycle transition
        const validTransitions = {
            "draft": ["in_progress", "cancelled"],
            "in_progress": ["completed", "cancelled"],
        };

        const updates = { updated_at: admin.firestore.FieldValue.serverTimestamp() };

        if (status) {
            if (!ALLOWED_STATUSES.includes(status)) {
                throw new HttpsError("invalid-argument", `INVALID_STATUS: '${status}' is not a valid status.`);
            }
            const allowed = validTransitions[current.status] || [];
            if (!allowed.includes(status)) {
                throw new HttpsError("failed-precondition", `INVALID_TRANSITION: Cannot transition from '${current.status}' to '${status}'.`);
            }

            // ─── COMPLETION VALIDATION ───────────────────────────────────────
            if (status === "completed") {
                const txnIds = transformation_document_ids || current.transformation_document_ids || [];
                if (!Array.isArray(txnIds) || txnIds.length === 0) {
                    throw new HttpsError(
                        "failed-precondition",
                        "MISSING_TRANSFORMATION_REFERENCE: A batch cannot be completed without at least one linked transformation_document_id."
                    );
                }

                // Verify each referenced transformation document exists and belongs to the same scope
                for (const txnId of txnIds) {
                    const txnSnap = await t.get(db.collection("documents").doc(txnId));
                    if (!txnSnap.exists) {
                        throw new HttpsError(
                            "not-found",
                            `INVALID_TRANSFORMATION_REF: Document '${txnId}' does not exist.`
                        );
                    }
                    const txnData = txnSnap.data();
                    if (txnData.document_type !== "inventory_transformation") {
                        throw new HttpsError(
                            "invalid-argument",
                            `WRONG_DOCUMENT_TYPE: Document '${txnId}' is not an inventory_transformation.`
                        );
                    }
                    if (txnData.company_id !== current.company_id ||
                        txnData.location_id !== current.location_id ||
                        txnData.unit_id !== current.unit_id) {
                        throw new HttpsError(
                            "permission-denied",
                            `CROSS_SCOPE_TRANSFORMATION: Document '${txnId}' does not belong to this batch's scope.`
                        );
                    }
                }
                updates.transformation_document_ids = txnIds;
                updates.completed_at = admin.firestore.FieldValue.serverTimestamp();
            }

            // ─── CANCELLATION GUARD ──────────────────────────────────────────
            // A cancelled batch MUST NOT trigger any inventory movement.
            // This is enforced architecturally: this function never writes to
            // inventory_states or inventory_events. The guard here is documentary.
            if (status === "cancelled") {
                updates.cancelled_at = admin.firestore.FieldValue.serverTimestamp();
                updates.cancelled_by = uid;
            }

            if (status === "in_progress" && current.status === "draft") {
                updates.started_at = admin.firestore.FieldValue.serverTimestamp();
            }

            updates.status = status;
        }

        // Recalculate yield if output_lines are updated
        if (output_lines) {
            validateLineScopeConsistency(output_lines, current.company_id, current.location_id, current.unit_id);
            const { total_input_qty, total_output_qty, actual_yield } = calculateYield(current.input_lines, output_lines);
            const variance = (current.expected_yield != null)
                ? parseFloat((actual_yield - current.expected_yield).toFixed(6))
                : null;
            updates.output_lines = output_lines;
            updates.total_output_qty = total_output_qty;
            updates.actual_yield = actual_yield;
            updates.variance = variance;
        }

        if (notes !== undefined) updates.notes = notes;

        t.update(batchRef, updates);
        return { success: true, doc_id, status: updates.status || current.status };
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: getProcessingBatch
// Retrieves a single batch with scope enforcement.
// ─────────────────────────────────────────────────────────────────────────────
exports.getProcessingBatch = onCall({ region: "asia-southeast1" }, async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, FACTORY_ROLES);

    const { doc_id } = request.data;
    if (!doc_id) throw new HttpsError("invalid-argument", "MISSING_DOC_ID");

    const db = admin.firestore();
    const snap = await db.collection("processing_batches").doc(doc_id).get();
    if (!snap.exists) throw new HttpsError("not-found", "BATCH_NOT_FOUND");

    const data = snap.data();
    requireLocationScope(user, data.location_id);
    requireUnitScope(user, data.unit_id);

    return { doc_id: snap.id, ...data };
});
