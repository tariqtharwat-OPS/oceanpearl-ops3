/**
 * OPS V3 - Incident Lifecycle Management (Phase 5)
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

const { requireAuth, getUserProfile, requireRole } = require("../lib/auth");
const { enforceQueryLimits } = require("../lib/queryGuards");

/**
 * listIncidents
 */
exports.listIncidents = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo", "finance_officer"]);

    const { status, limit = 50 } = request.data || {};
    const constrainedLimit = enforceQueryLimits("v3_incidents", { limit });

    let q = db.collection("v3_incidents")
        .orderBy("detectedAt", "desc")
        .limit(constrainedLimit);

    if (status) {
        q = q.where("status", "==", status);
    }

    const snap = await q.get();
    return snap.docs.map(doc => ({
        incidentId: doc.id,
        ...doc.data()
    }));
});

/**
 * acknowledgeIncident
 */
exports.acknowledgeIncident = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo", "finance_officer"]);

    const { incidentId } = request.data || {};
    if (!incidentId) throw new HttpsError("invalid-argument", "incidentId required.");

    const ref = db.collection("v3_incidents").doc(incidentId);
    await ref.update({
        status: "ACK",
        acknowledgedAt: FieldValue.serverTimestamp(),
        acknowledgedByUid: uid
    });

    return { ok: true };
});

/**
 * resolveIncident
 */
exports.resolveIncident = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo", "finance_officer"]);

    const { incidentId, resolutionNote } = request.data || {};
    if (!incidentId || !resolutionNote || resolutionNote.length < 20) {
        throw new HttpsError("invalid-argument", "incidentId and resolutionNote (min 20 chars) required.");
    }

    const ref = db.collection("v3_incidents").doc(incidentId);
    await ref.update({
        status: "RESOLVED",
        resolvedAt: FieldValue.serverTimestamp(),
        resolvedByUid: uid,
        resolutionNote
    });

    return { ok: true };
});
