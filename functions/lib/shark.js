/**
 * OPS V3 - Shark Operational Intelligence Engine (Phase 3)
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue, Timestamp } = require("firebase-admin/firestore");

const {
  requireAuth,
  getUserProfile,
  requireRole,
  requireLocationScope,
  requireUnitScope,
} = require("./auth");

const logger = require("./logger");
const config = require("./sharkConfig");
const detectors = require("./sharkDetectors");

// --------------------------
// Orchestration & Trigger
// --------------------------

async function recordAlerts(transaction, entryId, entry, alerts) {
  if (!alerts || alerts.length === 0) return;

  alerts.forEach(a => {
    const alertId = `${entryId}__${a.code}`;
    const alertRef = db.collection("v3_shark_alerts").doc(alertId);

    transaction.set(alertRef, {
      ...a,
      entryId,
      transactionId: entry.transactionId || null,
      locationId: entry.locationId || "UNKNOWN",
      unitId: entry.unitId || "UNKNOWN",
      openedAt: FieldValue.serverTimestamp(),
      status: "OPEN",
      version: 3,
      evidence: {
        accountId: entry.accountId || null,
        accountCategory: entry.accountCategory || null,
        baseAmountIDR: entry.baseAmountIDR || null,
        meta: entry.meta || null
      }
    }, { merge: true });
  });

  // Update Risk Model
  const locationId = entry.locationId || "UNKNOWN";
  const unitId = entry.unitId || "UNKNOWN";
  const riskRef = db.collection("v3_shark_location_risk").doc(`${locationId}__${unitId}`);

  let high = 0, medium = 0, low = 0, totalScore = 0;
  alerts.forEach(a => {
    totalScore += a.scoreImpact || 0;
    if (a.severity === "HIGH") high++;
    else if (a.severity === "MEDIUM") medium++;
    else low++;
  });

  transaction.set(riskRef, {
    locationId,
    unitId,
    totalScore: FieldValue.increment(totalScore),
    highSeverityCount: FieldValue.increment(high),
    mediumSeverityCount: FieldValue.increment(medium),
    lowSeverityCount: FieldValue.increment(low),
    lastUpdatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

/**
 * Trigger: processLedgerEvent
 * Logic:
 * 1. LARGE_CASH_MOVEMENT
 * 2. REPEATED_CASH_PATTERN
 * 3. MARGIN_ANOMALY (if entry is REVENUE/COGS)
 */
exports.processLedgerEvent = onDocumentCreated("v3_ledger_entries/{entryId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const entry = snap.data();
  const entryId = snap.id;

  const processedRef = db.collection("v3_shark_processed_entries").doc(entryId);

  await db.runTransaction(async (transaction) => {
    const pSnap = await transaction.get(processedRef);
    if (pSnap.exists) return;

    const alerts = [];

    // 1. LARGE_CASH_MOVEMENT
    const cashAlert = detectors.detectLargeCashMovement(entry);
    if (cashAlert) alerts.push(cashAlert);

    // 2. REPEATED_CASH_PATTERN (Cash per hour check)
    if (entry.accountCategory === "CASH") {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const cashSnap = await db.collection("v3_ledger_entries")
        .where("locationId", "==", entry.locationId)
        .where("accountCategory", "==", "CASH")
        .where("createdAt", ">=", Timestamp.fromDate(new Date(oneHourAgo)))
        .limit(config.CASH_LIMIT_PER_HOUR + 2)
        .get();

      const repeatAlert = detectors.detectRepeatedCashPattern(cashSnap.size);
      if (repeatAlert) alerts.push(repeatAlert);
    }

    // 3. MARGIN_ANOMALY
    if (entry.accountCategory === "REVENUE" || entry.accountCategory === "COGS") {
      // Need transaction siblings
      const sibSnap = await db.collection("v3_ledger_entries")
        .where("transactionId", "==", entry.transactionId)
        .get();
      const siblings = sibSnap.docs.map(d => d.data());
      const marginAlert = detectors.detectMarginAnomaly(siblings);
      if (marginAlert) alerts.push(marginAlert);
    }

    if (alerts.length > 0) {
      await recordAlerts(transaction, entryId, entry, alerts);
    }

    transaction.set(processedRef, {
      processedAt: FieldValue.serverTimestamp(),
      alertCount: alerts.length,
      version: 3
    });
  });
});

/**
 * Trigger: processTraceEvent
 * Logic: YIELD_ANOMALY
 */
exports.processTraceEvent = onDocumentCreated("v3_trace_events/{eventId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const trace = snap.data();
  const eventId = snap.id;

  if (trace.type !== "PRODUCTION") return;

  const processedRef = db.collection("v3_shark_processed_trace").doc(eventId);

  await db.runTransaction(async (transaction) => {
    const pSnap = await transaction.get(processedRef);
    if (pSnap.exists) return;

    const yieldAlert = detectors.detectYieldAnomaly(trace);
    if (yieldAlert) {
      // Re-using recordAlerts with a mock entry for dimension propagation
      const mockEntry = {
        locationId: trace.locationId,
        unitId: trace.unitId,
        transactionId: trace.transactionId,
        meta: { traceEventId: eventId }
      };
      await recordAlerts(transaction, eventId, mockEntry, [yieldAlert]);
    }

    transaction.set(processedRef, {
      processedAt: FieldValue.serverTimestamp(),
      alerted: !!yieldAlert,
      version: 3
    });
  });
});

// --------------------------
// Callable Endpoints
// --------------------------

/**
 * closeSharkAlert
 */
exports.closeSharkAlert = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "finance_officer"]);

  const { alertId, resolutionNote } = request.data || {};
  if (!alertId) throw new HttpsError("invalid-argument", "alertId required.");
  if (!resolutionNote || resolutionNote.length < 10) {
    throw new HttpsError("invalid-argument", "resolutionNote must be at least 10 chars.");
  }

  const ref = db.collection("v3_shark_alerts").doc(alertId);
  return await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Alert not found.");
    const a = snap.data();

    requireLocationScope(user, a.locationId);
    requireUnitScope(user, a.unitId);

    transaction.update(ref, {
      status: "CLOSED",
      closedAt: FieldValue.serverTimestamp(),
      closedByUid: uid,
      resolutionNote
    });

    return { ok: true };
  });
});

/**
 * listSharkAlerts (scoped, paginated)
 */
exports.listSharkAlerts = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "finance_officer", "location_manager", "investor", "shark"]);

  const { locationId, unitId, status, limit = 50, startAfterId } = request.data || {};
  requireLocationScope(user, locationId);
  requireUnitScope(user, unitId);

  let q = db.collection("v3_shark_alerts");
  if (locationId) q = q.where("locationId", "==", locationId);
  if (unitId) q = q.where("unitId", "==", unitId);
  if (status) q = q.where("status", "==", status);

  q = q.orderBy("openedAt", "desc").limit(Math.min(limit, 100));

  if (startAfterId) {
    const lastDoc = await db.collection("v3_shark_alerts").doc(startAfterId).get();
    if (lastDoc.exists) q = q.startAfter(lastDoc);
  }

  const snap = await q.get();

  // Safety Projection
  const privileged = ["admin", "ceo", "finance_officer"].includes(user.role);
  const items = snap.docs.map(d => {
    const data = { id: d.id, ...d.data() };
    if (!privileged) {
      delete data.closedByUid;
      if (data.evidence) delete data.evidence.meta;
      delete data.entryId;
    }
    return data;
  });

  return { items, count: items.length };
});

/**
 * getRiskSummary
 */
exports.getRiskSummary = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "finance_officer", "location_manager", "investor", "shark"]);

  const { locationId, unitId } = request.data || {};
  requireLocationScope(user, locationId);
  requireUnitScope(user, unitId);

  const riskId = `${locationId || "UNKNOWN"}__${unitId || "UNKNOWN"}`;
  const snap = await db.collection("v3_shark_location_risk").doc(riskId).get();

  if (!snap.exists) {
    return { totalScore: 0, highSeverityCount: 0, status: "NO_DATA" };
  }

  const data = snap.data();
  // Safety Projection
  if (!["admin", "ceo", "finance_officer"].includes(user.role)) {
    delete data.lastEntryId;
    delete data.lastTransactionId;
  }

  return data;
});

/**
 * getTopRiskLocations
 */
exports.getTopRiskLocations = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "finance_officer", "shark"]);

  const q = db.collection("v3_shark_location_risk")
    .orderBy("totalScore", "desc")
    .limit(10);

  const snap = await q.get();
  const results = snap.docs.map(d => d.data());

  return { results };
});

module.exports = {
  closeSharkAlert: exports.closeSharkAlert,
  listSharkAlerts: exports.listSharkAlerts,
  getRiskSummary: exports.getRiskSummary,
  getTopRiskLocations: exports.getTopRiskLocations,
  processLedgerEvent: exports.processLedgerEvent,
  processTraceEvent: exports.processTraceEvent,
};
