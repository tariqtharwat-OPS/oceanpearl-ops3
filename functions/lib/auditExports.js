/**
 * OPS V3 - Audit Export Engine (Phase 4)
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
const { enforceQueryLimits } = require("./queryGuards");

/**
 * exportTrialBalanceCSV
 */
exports.exportTrialBalanceCSV = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo"]);

    const { locationId, unitId } = request.data || {};

    const snap = await db.collection("v3_account_balance_shards")
        .where("locationId", "==", locationId || null)
        .where("unitId", "==", unitId || null)
        .get();

    const totals = {};
    snap.forEach(doc => {
        const d = doc.data();
        if (!totals[d.accountId]) {
            totals[d.accountId] = { accountId: d.accountId, debit: 0, credit: 0, balance: 0, category: d.accountCategory };
        }
        totals[d.accountId].debit += Number(d.debitTotal || 0);
        totals[d.accountId].credit += Number(d.creditTotal || 0);
        totals[d.accountId].balance += Number(d.balance || 0);
    });

    const rows = [
        "AccountId,Category,DebitTotal,CreditTotal,Balance",
        ...Object.values(totals).map(t =>
            `${t.accountId},${t.category},${t.debit},${t.credit},${t.balance}`
        )
    ];

    logger.info("Trial Balance exported", {
        module: "AUDIT",
        action: "EXPORT_TB",
        uid,
        metadata: { rowCount: Object.keys(totals).length, locationId, unitId }
    });

    return {
        csv: rows.join("\n"),
        exportGeneratedAt: new Date().toISOString(),
        exportGeneratedByUid: uid,
        scope: { locationId, unitId }
    };
});

/**
 * exportLedgerWindowCSV
 */
exports.exportLedgerWindowCSV = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo"]);

    const { locationId, unitId, limit = 1000, startAfterId } = request.data || {};

    const constrainedLimit = enforceQueryLimits("v3_ledger_entries", { limit });

    let q = db.collection("v3_ledger_entries")
        .where("locationId", "==", locationId || null)
        .where("unitId", "==", unitId || null)
        .orderBy("createdAt", "desc")
        .limit(constrainedLimit);

    if (startAfterId) {
        const lastDoc = await db.collection("v3_ledger_entries").doc(startAfterId).get();
        if (lastDoc.exists) q = q.startAfter(lastDoc);
    }

    const snap = await q.get();

    const rows = [
        "DocId,CreatedAt,TransactionId,AccountId,Direction,AmountIDR,EntryHash",
        ...snap.docs.map(d => {
            const e = d.data();
            return `${d.id},${e.createdAt.toDate().toISOString()},${e.transactionId},${e.accountId},${e.direction},${e.baseAmountIDR},${e.entryHash || ""}`;
        })
    ];

    logger.info("Ledger window exported", {
        module: "AUDIT",
        action: "EXPORT_LEDGER",
        uid,
        metadata: { rowCount: snap.size, limit: constrainedLimit }
    });

    return {
        csv: rows.join("\n"),
        count: snap.size,
        exportGeneratedAt: new Date().toISOString(),
        exportGeneratedByUid: uid
    };
});

/**
 * exportPnLSummaryJSON
 */
exports.exportPnLSummaryJSON = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo"]);

    const { locationId, unitId } = request.data || {};

    const snap = await db.collection("v3_account_balance_shards")
        .where("locationId", "==", locationId || null)
        .where("unitId", "==", unitId || null)
        .get();

    const pnl = {
        REVENUE: 0,
        COGS: 0,
        EXPENSE: 0,
        totalNet: 0
    };

    snap.forEach(doc => {
        const d = doc.data();
        const cat = d.accountCategory;
        const bal = Number(d.balance || 0);

        if (cat === "REVENUE") pnl.REVENUE += -bal; // Revenue is credit bal
        else if (cat === "COGS") pnl.COGS += bal;  // COGS is debit bal
        else if (cat === "EXPENSE") pnl.EXPENSE += bal;
    });

    pnl.totalNet = pnl.REVENUE - pnl.COGS - pnl.EXPENSE;

    return {
        summary: pnl,
        exportGeneratedAt: new Date().toISOString(),
        exportGeneratedByUid: uid,
        version: 4
    };
});
