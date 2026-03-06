/**
 * OPS V3 - Traceability (QR) Module
 *
 * Provides:
 *  - Callable getBatchTimeline (authenticated, scoped)
 *  - Public HTTPS endpoint verifyBatchPublic for QR scan validation
 *
 * Data model:
 *  - documents/{batchId}
 *  - audit_logs/{eventId}
 *  - Optional: v3_trace_public_cache/{batchId} (not required)
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();

const {
  requireAuth,
  getUserProfile,
  requireRole,
  requireLocationScope,
  requireUnitScope,
} = require("./auth");

exports.getBatchTimeline = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "finance_officer", "location_manager", "unit_operator", "investor", "shark"]);

  const { batchId, limit } = request.data || {};
  if (!batchId) throw new HttpsError("invalid-argument", "batchId required.");

  const batchSnap = await db.collection("documents").doc(batchId).get();
  if (!batchSnap.exists) throw new HttpsError("not-found", "batch not found.");
  const b = batchSnap.data() || {};

  requireLocationScope(user, b.locationId);
  requireUnitScope(user, b.unitId);

  const q = db.collection("audit_logs")
    .where("batchId", "in", [batchId])
    .orderBy("createdAt", "asc")
    .limit(Math.min(Number(limit || 200), 500));

  const evSnap = await q.get();
  const events = [];
  evSnap.forEach(d => events.push({ id: d.id, ...d.data() }));

  return { batch: { id: batchSnap.id, ...b }, events };
});

/**
 * Public verify endpoint used by QR scan.
 * URL pattern (recommended):
 *   https://<region>-<project>.cloudfunctions.net/verifyBatchPublic?batchId=XXXX
 *
 * Response: JSON suitable for a public verification page.
 * IMPORTANT: It only returns non-sensitive fields.
 */
exports.verifyBatchPublic = onRequest({ cors: true }, async (req, res) => {
  try {
    const batchId = String(req.query.batchId || "");
    if (!batchId) {
      res.status(400).json({ ok: false, error: "batchId required" });
      return;
    }

    const batchSnap = await db.collection("documents").doc(batchId).get();
    if (!batchSnap.exists) {
      res.status(404).json({ ok: false, error: "batch not found" });
      return;
    }

    const b = batchSnap.data() || {};

    // Public-safe projection
    const publicBatch = {
      batchId,
      skuId: b.skuId || null,
      status: b.status || null,
      locationId: b.locationId || null,
      unitId: b.unitId || null,
      createdAt: b.createdAt || null,
      parentBatchId: b.parentBatchId || null,
    };

    // Minimal event timeline (types + timestamps only)
    // transactionId removed for operational security
    const evSnap = await db.collection("audit_logs")
      .where("batchId", "==", batchId)
      .orderBy("createdAt", "asc")
      .limit(200)
      .get();

    const timeline = [];
    evSnap.forEach(d => {
      const e = d.data() || {};
      timeline.push({
        type: e.type || null,
        createdAt: e.createdAt || null,
        // transactionId explicitly omitted in Phase 1.5
      });
    });

    res.json({ ok: true, batch: publicBatch, timeline });
  } catch (err) {
    console.error("verifyBatchPublic error", err);
    res.status(500).json({ ok: false, error: "internal" });
  }
});
module.exports = {
  getBatchTimeline: exports.getBatchTimeline,
  verifyBatchPublic: exports.verifyBatchPublic,
};
