/**
 * OPS V3 - Inventory Engine (SECURED)
 *
 * Inventory valuation maintained server-side. Clients never write inventory docs.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

const {
  requireAuth,
  getUserProfile,
  requireRole,
  requireLocationScope,
  requireUnitScope,
} = require("./auth");

const logger = require("./logger");

/**
 * Internal helper: Prepare inventory update (READ phase).
 * Useful for complex transactions to avoid "read after write" errors.
 */
async function getInventoryUpdatePayload({ locationId, unitId, skuId, deltaQtyKg, newAvgCostIDR }, transaction) {
  if (!locationId || !unitId || !skuId) {
    throw new HttpsError("invalid-argument", "locationId, unitId, skuId required.");
  }
  if (!transaction) throw new Error("Inventory update requires an active transaction.");

  const docId = `${locationId}__${unitId}__${skuId}`;
  const ref = db.collection("inventory_events").doc(docId);

  const snap = await transaction.get(ref);
  const current = snap.exists ? snap.data() : { qtyKg: 0, avgCostIDR: 0 };

  const oldQty = Number(current.qtyKg || 0);
  const oldAvg = Number(current.avgCostIDR || 0);
  const changeQty = Number(deltaQtyKg || 0);
  const addCost = Number(newAvgCostIDR || 0);

  const newQty = oldQty + changeQty;
  let newAvg = oldAvg;

  if (changeQty > 0) {
    const oldVal = oldQty * oldAvg;
    const incomingVal = changeQty * addCost;
    newAvg = (oldVal + incomingVal) / newQty;
  } else if (changeQty < 0) {
    newAvg = oldAvg;
  }

  if (newQty <= 0) newAvg = 0;

  const payload = {
    locationId,
    unitId,
    skuId,
    qtyKg: FieldValue.increment(changeQty),
    avgCostIDR: Math.round(newAvg),
    updatedAt: FieldValue.serverTimestamp(),
    version: 3,
  };

  return { ref, payload, docId, oldQty, changeQty, newQty, oldAvg };
}

/**
 * Atomic update wrapper (legacy compatible).
 */
async function updateInventoryValuation(params, transaction) {
  const { ref, payload, docId, oldQty, changeQty, newQty, oldAvg } = await getInventoryUpdatePayload(params, transaction);
  logger.info("Inventory update (WAC)", { docId, oldQty, changeQty, newQty, oldAvg, newAvg: payload.avgCostIDR });
  transaction.set(ref, payload, { merge: true });
}

/**
 * Callable: Get valuation for SKU in scope
 */
exports.getInventoryValuation = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);

  const { locationId, unitId, skuId } = request.data || {};
  if (!locationId || !unitId || !skuId) throw new HttpsError("invalid-argument", "locationId, unitId, skuId required.");

  requireRole(user, ["admin", "ceo", "finance_officer", "location_manager", "unit_operator", "investor", "shark"]);
  requireLocationScope(user, locationId);
  requireUnitScope(user, unitId);

  const docId = `${locationId}__${unitId}__${skuId}`;
  const snap = await db.collection("inventory_events").doc(docId).get();

  if (!snap.exists) {
    return { locationId, unitId, skuId, qtyKg: 0, avgCostIDR: 0 };
  }

  const data = snap.data();
  return {
    locationId: data.locationId,
    unitId: data.unitId,
    skuId: data.skuId,
    qtyKg: data.qtyKg || 0,
    avgCostIDR: data.avgCostIDR || 0,
    updatedAt: data.updatedAt
  };
});

/**
 * Callable: List valuations for a scope (location+unit)
 */
exports.listInventoryValuations = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);

  const { locationId, unitId, limit } = request.data || {};
  if (!locationId || !unitId) throw new HttpsError("invalid-argument", "locationId, unitId required.");

  requireRole(user, ["admin", "ceo", "finance_officer", "location_manager", "unit_operator", "investor", "shark"]);
  requireLocationScope(user, locationId);
  requireUnitScope(user, unitId);

  const q = db.collection("inventory_events")
    .where("locationId", "==", locationId)
    .where("unitId", "==", unitId)
    .limit(Math.min(Number(limit || 200), 500));

  const snap = await q.get();
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return { locationId, unitId, items };
});

module.exports = {
  updateInventoryValuation,
  getInventoryUpdatePayload,
  getInventoryValuation: exports.getInventoryValuation,
  listInventoryValuations: exports.listInventoryValuations,
};
