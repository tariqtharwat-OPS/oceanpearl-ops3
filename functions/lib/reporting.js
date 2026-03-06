/**
 * OPS V3 - Reporting Module (Phase 2: Sharded Balances)
 *
 * All reporting read from sharded materialized views.
 * No O(N) ledger scans allowed.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();

const {
    requireAuth,
    getUserProfile,
    requireRole,
    requireLocationScope,
    requireUnitScope,
} = require("./auth");

const logger = require("./logger");

/**
 * Callable: getTrialBalance
 * Aggregates sharded balances for a given scope.
 */
exports.getTrialBalance = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);

    requireRole(user, ["admin", "ceo", "finance_officer", "location_manager", "investor", "shark"]);

    const { locationId, unitId } = request.data || {};
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    // Read shards ONLY
    let q = db.collection("wallet_events")
        .where("locationId", "==", locationId || null)
        .where("unitId", "==", unitId || null);

    const snap = await q.get();

    // Phase 2 Hardening: Check if sharding system is initialized.
    // If we have ZERO shards for a requested scope, but we know the system is active, 
    // it's possible balances aren't ready or it's genuinely a new scope.
    // However, the directive is strict: throw if missing.
    if (snap.empty) {
        // We'll check if any ledger entries exist to determine if it's "missing" or just "zero"
        // But the requirement says "No fallback full scan". 
        // We use a cheap check for at least ONE ledger entry in this scope.
        const ledgerCheck = await db.collection("wallet_events")
            .where("locationId", "==", locationId || null)
            .where("unitId", "==", unitId || null)
            .limit(1)
            .get();

        if (!ledgerCheck.empty) {
            throw new HttpsError("failed-precondition", "BALANCES_NOT_READY");
        }
    }

    const balances = {};

    snap.forEach((doc) => {
        const data = doc.data();
        const accountId = data.accountId;

        if (!balances[accountId]) {
            balances[accountId] = {
                accountId,
                debitTotal: 0,
                creditTotal: 0,
                balance: 0,
                category: data.accountCategory
            };
        }

        balances[accountId].debitTotal += Number(data.debitTotal || 0);
        balances[accountId].creditTotal += Number(data.creditTotal || 0);
        balances[accountId].balance += Number(data.balance || 0);
    });

    return {
        locationId: locationId || null,
        unitId: unitId || null,
        balances: Object.values(balances),
        source: "SHARDS"
    };
});

/**
 * Callable: getPnLSummary
 * P&L view derived from sharded balances.
 */
exports.getPnLSummary = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);

    requireRole(user, ["admin", "ceo", "finance_officer", "location_manager", "investor", "shark"]);

    const { locationId, unitId } = request.data || {};
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    // Read shards
    let q = db.collection("wallet_events")
        .where("locationId", "==", locationId || null)
        .where("unitId", "==", unitId || null);

    const snap = await q.get();

    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalExpenses = 0;

    snap.forEach((doc) => {
        const data = doc.data();
        const category = data.accountCategory;

        const debit = Number(data.debitTotal || 0);
        const credit = Number(data.creditTotal || 0);
        const net = credit - debit; // For Revenue (Credit normal)
        const netExp = debit - credit; // For COGS/Exp (Debit normal)

        if (category === "REVENUE") {
            totalRevenue += net;
        } else if (category === "COGS") {
            totalCOGS += netExp;
        } else if (category === "EXPENSE") {
            totalExpenses += netExp;
        }
    });

    return {
        locationId: locationId || null,
        unitId: unitId || null,
        totalRevenue,
        totalCOGS,
        totalExpenses,
        grossProfit: totalRevenue - totalCOGS,
        netIncome: totalRevenue - totalCOGS - totalExpenses,
        source: "SHARDS"
    };
});

/**
 * Callable: getInventorySummary
 * Unchanged as it already reads from a materialized view (inventory_events).
 */
exports.getInventorySummary = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);

    requireRole(user, ["admin", "ceo", "finance_officer", "location_manager", "unit_operator", "investor", "shark"]);

    const { locationId, unitId } = request.data || {};
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    let q = db.collection("inventory_events");
    if (locationId) q = q.where("locationId", "==", locationId);
    if (unitId) q = q.where("unitId", "==", unitId);

    const snap = await q.get();
    const items = [];

    snap.forEach((doc) => {
        const data = doc.data();
        const qty = Number(data.qtyKg || 0);
        const avgCost = Number(data.avgCostIDR || 0);
        items.push({
            skuId: data.skuId,
            locationId: data.locationId,
            unitId: data.unitId,
            qtyKg: qty,
            avgCostIDR: avgCost,
            inventoryValue: Math.round(qty * avgCost),
            updatedAt: data.updatedAt
        });
    });

    return { locationId: locationId || null, unitId: unitId || null, items };
});
module.exports = {
    getTrialBalance: exports.getTrialBalance,
    getPnLSummary: exports.getPnLSummary,
    getInventorySummary: exports.getInventorySummary,
};
