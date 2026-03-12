/**
 * OPS V3 — Phase 2 Step 3
 * Work-In-Progress (WIP) Processing Module
 *
 * Provides factory WIP state management as a traceability layer.
 *
 * ARCHITECTURAL PRINCIPLE:
 * This module NEVER directly mutates inventory_states or writes inventory_events.
 * All inventory movements are performed exclusively through validated
 * inventory_transformation documents processed by documentProcessor.js.
 *
 * WIP LIFECYCLE:
 *   pending → active → completed
 *                    ↘ cancelled
 *
 * WIP FLOW:
 *   1. createWipState()     — Register raw material entering WIP
 *   2. advanceWipStage()    — Progress through processing stages
 *   3. completeWipState()   — Link to a completed transformation document
 *   4. cancelWipState()     — Abandon WIP (no inventory mutation)
 */

"use strict";

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// ─── Constants ────────────────────────────────────────────────────────────────
const REGION = "asia-southeast1";

const FACTORY_ROLES = [
    "factory_operator",
    "factory_manager",
    "unit_manager",
    "location_manager",
    "admin",
    "ceo",
];

const HQ_ROLES = ["hq_analyst", "admin", "ceo"];

// Valid WIP lifecycle stages (ordered)
const WIP_STAGES = [
    "receiving",   // Raw material accepted into factory
    "sorting",     // Grading and sorting
    "processing",  // Active transformation (cutting, filleting, drying, etc.)
    "quality_check", // QC inspection
    "packing",     // Final packing before output
];

// Valid status transitions
const VALID_TRANSITIONS = {
    "pending":   ["active", "cancelled"],
    "active":    ["completed", "cancelled"],
};

// ─── Auth & Scope Helpers ─────────────────────────────────────────────────────
function requireAuth(request) {
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError("unauthenticated", "AUTH_REQUIRED");
    }
    return request.auth.uid;
}

// Canonical user profile source: v3_users (aligned with auth.js and all other modules)
async function getUserProfile(uid) {
    const db = admin.firestore();
    const snap = await db.collection("v3_users").doc(uid).get();
    if (!snap.exists) throw new HttpsError("not-found", "USER_NOT_FOUND");
    const data = snap.data();
    data.uid = uid;
    return data;
}

function requireRole(user, allowedRoles) {
    const role = (user.role || "").toLowerCase();
    if (!allowedRoles.map(r => r.toLowerCase()).includes(role)) {
        throw new HttpsError("permission-denied", `ROLE_DENIED: Role '${role}' is not authorized.`);
    }
}

// v3_users schema uses allowedLocationIds[] (array) instead of scalar location_id
function requireLocationScope(user, location_id) {
    if (!location_id) return;
    const role = (user.role || "").toLowerCase();
    const isHQ = HQ_ROLES.map(r => r.toLowerCase()).includes(role);
    if (isHQ) return;
    const allowed = Array.isArray(user.allowedLocationIds) ? user.allowedLocationIds.map(String) : [];
    if (!allowed.includes(String(location_id))) {
        throw new HttpsError("permission-denied", "LOCATION_SCOPE_MISMATCH");
    }
}

// v3_users schema uses allowedUnitIds[] (array) instead of scalar unit_id
function requireUnitScope(user, unit_id) {
    if (!unit_id) return;
    const role = (user.role || "").toLowerCase();
    const isHQ = HQ_ROLES.map(r => r.toLowerCase()).includes(role);
    const isLocationManager = role === "location_manager";
    if (isHQ || isLocationManager) return;
    const allowed = Array.isArray(user.allowedUnitIds) ? user.allowedUnitIds.map(String) : [];
    if (!allowed.includes(String(unit_id))) {
        throw new HttpsError("permission-denied", "UNIT_SCOPE_MISMATCH");
    }
}

// ─── Validation Helpers ───────────────────────────────────────────────────────
function validateRequiredFields(data, fields) {
    for (const f of fields) {
        if (data[f] === undefined || data[f] === null || data[f] === "") {
            throw new HttpsError("invalid-argument", `MISSING_FIELD: '${f}' is required.`);
        }
    }
}

function validateStage(stage) {
    if (!WIP_STAGES.includes(stage)) {
        throw new HttpsError(
            "invalid-argument",
            `INVALID_STAGE: '${stage}' is not a valid WIP stage. Valid stages: ${WIP_STAGES.join(", ")}`
        );
    }
}

function validateQuantity(qty, fieldName = "quantity") {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
        throw new HttpsError("invalid-argument", `INVALID_QUANTITY: '${fieldName}' must be a positive number.`);
    }
    return n;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: createWipState
// Registers raw material entering the WIP pipeline for a given batch.
// ─────────────────────────────────────────────────────────────────────────────
exports.createWipState = onCall({ region: REGION }, async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, FACTORY_ROLES);

    const {
        batch_id,
        company_id,
        location_id,
        unit_id,
        sku_id,
        quantity,
        stage,
        operator_id,
        expected_completion,
        notes,
    } = request.data;

    // ── Field Validation ──────────────────────────────────────────────────────
    validateRequiredFields(request.data, [
        "batch_id", "company_id", "location_id", "unit_id", "sku_id", "quantity", "stage",
    ]);
    const validatedQty = validateQuantity(quantity);
    validateStage(stage);

    // ── Scope Enforcement ─────────────────────────────────────────────────────
    requireLocationScope(user, location_id);
    requireUnitScope(user, unit_id);

    const db = admin.firestore();

    // ── Verify the linked batch exists and belongs to the same scope ──────────
    const batchQuery = await db.collection("processing_batches")
        .where("batch_id", "==", batch_id)
        .where("company_id", "==", company_id)
        .where("location_id", "==", location_id)
        .where("unit_id", "==", unit_id)
        .limit(1).get();

    if (batchQuery.empty) {
        throw new HttpsError(
            "not-found",
            `BATCH_NOT_FOUND: No processing batch '${batch_id}' found in this scope.`
        );
    }

    const batchData = batchQuery.docs[0].data();
    if (batchData.status === "completed" || batchData.status === "cancelled") {
        throw new HttpsError(
            "failed-precondition",
            `BATCH_TERMINAL: Cannot add WIP to a batch with status '${batchData.status}'.`
        );
    }

    // ── Create WIP State Document ─────────────────────────────────────────────
    const now = admin.firestore.FieldValue.serverTimestamp();
    const wipRef = db.collection("wip_states").doc();

    await wipRef.set({
        // Scope
        company_id,
        location_id,
        unit_id,
        // Identity
        batch_id,
        sku_id,
        operator_id: operator_id || uid,
        // State
        status: "pending",
        stage,
        stage_history: [{ stage, entered_at: new Date().toISOString(), operator_id: operator_id || uid }],
        // Quantities
        quantity: validatedQty,
        quantity_in: validatedQty,
        quantity_out: null,
        // Linkage (populated on completion)
        transformation_document_id: null,
        // Timestamps
        started_at: null,
        expected_completion: expected_completion || null,
        completed_at: null,
        cancelled_at: null,
        created_at: now,
        updated_at: now,
        created_by: uid,
        // Notes
        notes: notes || null,
    });

    return { success: true, doc_id: wipRef.id, batch_id, sku_id, status: "pending" };
});

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: advanceWipStage
// Progresses a WIP record through processing stages.
// This is a traceability operation only — no inventory mutation occurs.
// ─────────────────────────────────────────────────────────────────────────────
exports.advanceWipStage = onCall({ region: REGION }, async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, FACTORY_ROLES);

    const { doc_id, new_stage, quantity_loss, notes } = request.data;

    validateRequiredFields(request.data, ["doc_id", "new_stage"]);
    validateStage(new_stage);

    const db = admin.firestore();

    return db.runTransaction(async (t) => {
        const wipRef = db.collection("wip_states").doc(doc_id);
        const snap = await t.get(wipRef);

        if (!snap.exists) throw new HttpsError("not-found", "WIP_NOT_FOUND");
        const wip = snap.data();

        // ── Scope Enforcement ─────────────────────────────────────────────────
        requireLocationScope(user, wip.location_id);
        requireUnitScope(user, wip.unit_id);

        // ── Status Guard ──────────────────────────────────────────────────────
        if (wip.status === "completed" || wip.status === "cancelled") {
            throw new HttpsError(
                "failed-precondition",
                `TERMINAL_STATE: WIP record is already '${wip.status}'.`
            );
        }

        // ── Stage Progression Guard ───────────────────────────────────────────
        const currentStageIdx = WIP_STAGES.indexOf(wip.stage);
        const newStageIdx = WIP_STAGES.indexOf(new_stage);
        if (newStageIdx <= currentStageIdx) {
            throw new HttpsError(
                "failed-precondition",
                `INVALID_STAGE_PROGRESSION: Cannot move from '${wip.stage}' to '${new_stage}'. Stages must advance forward.`
            );
        }

        // ── Quantity Loss Tracking ────────────────────────────────────────────
        // Loss is recorded for traceability but does NOT mutate inventory_states.
        // Actual inventory adjustment is handled by the transformation document.
        let updatedQty = wip.quantity;
        if (quantity_loss != null) {
            const loss = validateQuantity(quantity_loss, "quantity_loss");
            if (loss >= wip.quantity) {
                throw new HttpsError(
                    "invalid-argument",
                    "TOTAL_LOSS: quantity_loss cannot be >= current quantity. Use cancelWipState instead."
                );
            }
            updatedQty = parseFloat((wip.quantity - loss).toFixed(6));
        }

        // ── Build Stage History ───────────────────────────────────────────────
        const stageHistory = wip.stage_history || [];
        stageHistory.push({
            stage: new_stage,
            entered_at: new Date().toISOString(),
            operator_id: uid,
            quantity_loss: quantity_loss || 0,
        });

        const updates = {
            stage: new_stage,
            stage_history: stageHistory,
            quantity: updatedQty,
            status: "active",
            started_at: wip.started_at || admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (notes !== undefined) updates.notes = notes;

        t.update(wipRef, updates);
        return { success: true, doc_id, new_stage, quantity: updatedQty };
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: completeWipState
// Marks WIP as completed and links it to a validated transformation document.
// The transformation document is the actual inventory event — WIP is traceability only.
// ─────────────────────────────────────────────────────────────────────────────
exports.completeWipState = onCall({ region: REGION }, async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, FACTORY_ROLES);

    const { doc_id, transformation_document_id, quantity_out, notes } = request.data;

    validateRequiredFields(request.data, ["doc_id", "transformation_document_id"]);

    const db = admin.firestore();

    return db.runTransaction(async (t) => {
        const wipRef = db.collection("wip_states").doc(doc_id);
        const snap = await t.get(wipRef);

        if (!snap.exists) throw new HttpsError("not-found", "WIP_NOT_FOUND");
        const wip = snap.data();

        // ── Scope Enforcement ─────────────────────────────────────────────────
        requireLocationScope(user, wip.location_id);
        requireUnitScope(user, wip.unit_id);

        // ── Status Guard ──────────────────────────────────────────────────────
        if (wip.status === "completed") {
            throw new HttpsError("already-exists", "ALREADY_COMPLETED");
        }
        if (wip.status === "cancelled") {
            throw new HttpsError("failed-precondition", "CANCELLED_WIP: Cannot complete a cancelled WIP record.");
        }

        // ── Validate Transformation Document ─────────────────────────────────
        const txnSnap = await t.get(db.collection("documents").doc(transformation_document_id));
        if (!txnSnap.exists) {
            throw new HttpsError(
                "not-found",
                `TRANSFORMATION_NOT_FOUND: Document '${transformation_document_id}' does not exist.`
            );
        }
        const txnData = txnSnap.data();

        // Verify document type
        if (txnData.document_type !== "inventory_transformation") {
            throw new HttpsError(
                "invalid-argument",
                `WRONG_DOCUMENT_TYPE: '${transformation_document_id}' is not an inventory_transformation document.`
            );
        }

        // Verify document is posted (processed by the ledger engine)
        if (txnData.status !== "posted") {
            throw new HttpsError(
                "failed-precondition",
                `TRANSFORMATION_NOT_POSTED: Document '${transformation_document_id}' has status '${txnData.status}'. Only posted documents can be linked.`
            );
        }

        // Verify scope match — transformation must belong to same unit as WIP
        if (txnData.company_id !== wip.company_id ||
            txnData.location_id !== wip.location_id ||
            txnData.unit_id !== wip.unit_id) {
            throw new HttpsError(
                "permission-denied",
                `CROSS_SCOPE_TRANSFORMATION: Transformation document does not belong to this WIP's scope.`
            );
        }

        // ── Validate quantity_out ─────────────────────────────────────────────
        const finalQtyOut = quantity_out != null
            ? validateQuantity(quantity_out, "quantity_out")
            : wip.quantity;

        // ── Complete WIP ──────────────────────────────────────────────────────
        const stageHistory = wip.stage_history || [];
        stageHistory.push({
            stage: "completed",
            entered_at: new Date().toISOString(),
            operator_id: uid,
        });

        t.update(wipRef, {
            status: "completed",
            stage: "completed",
            stage_history: stageHistory,
            transformation_document_id,
            quantity_out: finalQtyOut,
            completed_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            notes: notes !== undefined ? notes : wip.notes,
        });

        return {
            success: true,
            doc_id,
            transformation_document_id,
            quantity_in: wip.quantity_in,
            quantity_out: finalQtyOut,
        };
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: cancelWipState
// Cancels a WIP record. DOES NOT trigger any inventory mutation.
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelWipState = onCall({ region: REGION }, async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, FACTORY_ROLES);

    const { doc_id, reason } = request.data;
    validateRequiredFields(request.data, ["doc_id"]);

    const db = admin.firestore();

    return db.runTransaction(async (t) => {
        const wipRef = db.collection("wip_states").doc(doc_id);
        const snap = await t.get(wipRef);

        if (!snap.exists) throw new HttpsError("not-found", "WIP_NOT_FOUND");
        const wip = snap.data();

        // ── Scope Enforcement ─────────────────────────────────────────────────
        requireLocationScope(user, wip.location_id);
        requireUnitScope(user, wip.unit_id);

        // ── Terminal State Guard ──────────────────────────────────────────────
        if (wip.status === "completed") {
            throw new HttpsError(
                "failed-precondition",
                "ALREADY_COMPLETED: Cannot cancel a completed WIP record."
            );
        }
        if (wip.status === "cancelled") {
            throw new HttpsError("already-exists", "ALREADY_CANCELLED");
        }

        const stageHistory = wip.stage_history || [];
        stageHistory.push({
            stage: "cancelled",
            entered_at: new Date().toISOString(),
            operator_id: uid,
            reason: reason || null,
        });

        // CRITICAL: This update ONLY changes the wip_states document.
        // No inventory_states or inventory_events are touched.
        t.update(wipRef, {
            status: "cancelled",
            stage_history: stageHistory,
            cancelled_at: admin.firestore.FieldValue.serverTimestamp(),
            cancelled_by: uid,
            cancellation_reason: reason || null,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, doc_id, status: "cancelled" };
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: getWipState
// Retrieves a single WIP record with scope enforcement.
// ─────────────────────────────────────────────────────────────────────────────
exports.getWipState = onCall({ region: REGION }, async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, FACTORY_ROLES);

    const { doc_id } = request.data;
    if (!doc_id) throw new HttpsError("invalid-argument", "MISSING_DOC_ID");

    const db = admin.firestore();
    const snap = await db.collection("wip_states").doc(doc_id).get();
    if (!snap.exists) throw new HttpsError("not-found", "WIP_NOT_FOUND");

    const data = snap.data();
    requireLocationScope(user, data.location_id);
    requireUnitScope(user, data.unit_id);

    return { doc_id: snap.id, ...data };
});
