/**
 * OPS V3 - Financial Period Control & Snapshots
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
} = require("../lib/auth");

const logger = require("../lib/logger");

/**
 * adminOpenPeriod
 * CEO/Admin only. Creates a new financial period.
 */
exports.adminOpenPeriod = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo"]);

    const { periodId, startDate, endDate } = request.data || {};
    if (!periodId || !startDate || !endDate) {
        throw new HttpsError("invalid-argument", "periodId, startDate, endDate required.");
    }

    const periodRef = db.collection("v3_financial_periods").doc(periodId);
    await periodRef.set({
        periodId,
        startDate,
        endDate,
        status: "OPEN",
        createdAt: FieldValue.serverTimestamp(),
        createdByUid: uid,
        version: 4
    });

    return { ok: true, periodId };
});

/**
 * closeFinancialPeriod
 * Admin/CEO only. Computes snapshots and locks period.
 */
exports.closeFinancialPeriod = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo"]);

    const { periodId, confirm } = request.data || {};
    if (!periodId || confirm !== true) {
        throw new HttpsError("invalid-argument", "periodId and explicit confirm=true required.");
    }

    const periodRef = db.collection("v3_financial_periods").doc(periodId);

    return await db.runTransaction(async (transaction) => {
        const pSnap = await transaction.get(periodRef);
        if (!pSnap.exists) throw new HttpsError("not-found", "Period not found.");
        if (pSnap.data().status === "CLOSED") throw new HttpsError("failed-precondition", "Period already closed.");

        const period = pSnap.data();

        // 1. Compute Snapshots (Materialized)
        // Trial Balance
        const tbSnap = await db.collection("v3_account_balance_shards").get();
        const trialBalanceSnapshot = {};
        tbSnap.forEach(doc => {
            const d = doc.data();
            const key = `${d.accountId}__${d.locationId || "null"}__${d.unitId || "null"}`;
            if (!trialBalanceSnapshot[key]) trialBalanceSnapshot[key] = { balance: 0, debit: 0, credit: 0 };
            trialBalanceSnapshot[key].debit += Number(d.debitTotal || 0);
            trialBalanceSnapshot[key].credit += Number(d.creditTotal || 0);
            trialBalanceSnapshot[key].balance += Number(d.balance || 0);
        });

        // Inventory
        const invSnap = await db.collection("v3_inventory_valuations").get();
        const inventorySnapshot = invSnap.docs.map(d => d.data());

        // 2. Store Period Snapshot
        const snapshotRef = db.collection("v3_period_snapshots").doc(periodId);
        transaction.set(snapshotRef, {
            periodId,
            trialBalanceSnapshot,
            inventorySnapshot,
            closedAt: FieldValue.serverTimestamp(),
            closedByUid: uid,
            version: 4
        });

        // 3. Freeze Risk Scores
        const riskSnap = await db.collection("v3_shark_location_risk").get();
        riskSnap.forEach(doc => {
            const riskData = doc.data();
            const riskSnapshotRef = db.collection("v3_period_risk_snapshots").doc(`${periodId}__${doc.id}`);
            transaction.set(riskSnapshotRef, {
                ...riskData,
                periodId,
                capturedAt: FieldValue.serverTimestamp()
            });
        });

        // 4. Update Period Status
        transaction.update(periodRef, {
            status: "CLOSED",
            closedAt: FieldValue.serverTimestamp(),
            closedByUid: uid
        });

        return { ok: true, periodId };
    });
});

/**
 * adminReopenPeriod
 * CEO/Admin only. Logs audit trail.
 */
exports.adminReopenPeriod = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo"]);

    const { periodId, reason } = request.data || {};
    if (!periodId || !reason || reason.length < 10) {
        throw new HttpsError("invalid-argument", "periodId and reason (min 10 chars) required.");
    }

    const periodRef = db.collection("v3_financial_periods").doc(periodId);

    await db.runTransaction(async (transaction) => {
        const pSnap = await transaction.get(periodRef);
        if (!pSnap.exists) throw new HttpsError("not-found", "Period not found.");

        transaction.update(periodRef, {
            status: "OPEN",
            reopenedAt: FieldValue.serverTimestamp(),
            reopenedByUid: uid,
            reopenReason: reason
        });

        // Audit Trail in trace_events
        const traceRef = db.collection("v3_trace_events").doc();
        transaction.set(traceRef, {
            type: "PERIOD_REOPENED",
            periodId,
            reason,
            byUid: uid,
            createdAt: FieldValue.serverTimestamp(),
            version: 4
        });
    });

    return { ok: true };
});
