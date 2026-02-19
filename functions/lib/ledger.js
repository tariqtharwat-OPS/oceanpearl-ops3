/**
 * OPS V3 - Ledger Core Module (SECURED)
 *
 * Immutable, double-entry ledger.
 * Phase 2: Sharded materialized balances.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
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
const { enforceQueryLimits } = require("./queryGuards");

const SHARD_COUNT = 20;

/**
 * Internal: Get a deterministic shard ID for a transaction.
 * Spreads load across shards to avoid contention on hot accounts.
 */
function getShardId(transactionId) {
  // Simple hash of transactionId to get a number 0-19
  let hash = 0;
  for (let i = 0; i < transactionId.length; i++) {
    hash = (hash << 5) - hash + transactionId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % SHARD_COUNT;
}

/**
 * Internal: Update sharded balances atomically.
 * Must be called within a transaction batch.
 */
function updateBalanceShards(transaction, entries, transactionId) {
  const shardId = getShardId(transactionId);
  const accountTotals = {};

  // Aggregate entries by account/scope to minimize writes
  entries.forEach(e => {
    const key = `${e.accountId}__${e.locationId || null}__${e.unitId || null}`;
    if (!accountTotals[key]) {
      accountTotals[key] = {
        debit: 0,
        credit: 0,
        accountId: e.accountId,
        locationId: e.locationId || null,
        unitId: e.unitId || null,
        category: e.accountCategory || "OTHER"
      };
    }
    const amt = Number(e.baseAmountIDR);
    if (e.direction === "debit") accountTotals[key].debit += amt;
    else accountTotals[key].credit += amt;
  });

  Object.keys(accountTotals).forEach(key => {
    const t = accountTotals[key];
    const shardRef = db.collection("v3_account_balance_shards")
      .doc(`${key}__${shardId}`);

    transaction.set(shardRef, {
      accountId: t.accountId,
      locationId: t.locationId,
      unitId: t.unitId,
      shardId: shardId,
      accountCategory: t.category,
      debitTotal: FieldValue.increment(t.debit),
      creditTotal: FieldValue.increment(t.credit),
      balance: FieldValue.increment(t.debit - t.credit),
      updatedAt: FieldValue.serverTimestamp(),
      version: 3
    }, { merge: true });
  });
}

/**
 * Internal: Prepare ledger entries (READ phase).
 */
async function getLedgerUpdatePayload({ transactionId, entries, createdByUid, entryDate }, batch) {
  if (!transactionId || !Array.isArray(entries) || entries.length === 0) {
    throw new HttpsError("invalid-argument", "transactionId and entries are required.");
  }
  if (!batch) {
    throw new Error("getLedgerUpdatePayload requires a transaction object (batch).");
  }

  // Validate balance
  let debitTotal = 0;
  let creditTotal = 0;
  for (const e of entries) {
    if (!e || !e.accountId || e.baseAmountIDR === undefined || e.baseAmountIDR === null || !e.direction) {
      throw new HttpsError("invalid-argument", "Invalid entry: missing fields.");
    }
    const amt = Math.round(Number(e.baseAmountIDR));
    e.baseAmountIDR = amt;
    if (e.direction === "debit") debitTotal += amt;
    else creditTotal += amt;
  }
  if (Math.round(debitTotal) !== Math.round(creditTotal)) {
    throw new HttpsError("failed-precondition", "Ledger entries do not balance.");
  }

  // ALL READS START HERE
  const logicalDate = entryDate || new Date();
  const periodSnap = await batch.get(
    db.collection("v3_financial_periods")
      .where("startDate", "<=", logicalDate)
      .where("endDate", ">=", logicalDate)
      .limit(1)
  );
  if (!periodSnap.empty && periodSnap.docs[0].data().status === "CLOSED") {
    throw new HttpsError("failed-precondition", "PERIOD_CLOSED");
  }

  const crypto = require("crypto");
  const scopes = new Set();
  entries.forEach(e => scopes.add(`${e.accountId}__${e.locationId || null}__${e.unitId || null}`));

  const headHashes = {};
  for (const sKey of scopes) {
    const [aid, lid, uid] = sKey.split("__");
    let q = db.collection("v3_ledger_entries")
      .where("accountId", "==", aid)
      .where("locationId", "==", lid === "null" ? null : lid)
      .where("unitId", "==", uid === "null" ? null : uid)
      .orderBy("createdAt", "desc")
      .limit(1);

    const snap = await batch.get(q);
    headHashes[sKey] = snap.empty ? "0000000000000000000000000000000000000000000000000000000000000000" : snap.docs[0].data().entryHash;
  }
  // ALL READS ENDED

  const writePayloads = [];
  const fixedCreatedAt = logicalDate.toISOString();

  entries.forEach((entry) => {
    const scopeKey = `${entry.accountId}__${entry.locationId || null}__${entry.unitId || null}`;
    const previousHash = headHashes[scopeKey];
    const aid = String(entry.accountId).toUpperCase();
    let category = entry.accountCategory;
    if (!category) {
      if (aid.includes("REVENUE")) category = "REVENUE";
      else if (aid.includes("COGS")) category = "COGS";
      else if (aid.includes("EXPENSE") || aid.includes("LOSS")) category = "EXPENSE";
      else if (aid.includes("CASH") || aid.includes("BANK")) category = "CASH";
      else if (aid.includes("INV")) category = "INVENTORY";
      else if (aid.includes("RECEIVABLE")) category = "RECEIVABLE";
      else if (aid.includes("PAYABLE")) category = "PAYABLE";
      else category = "OTHER";
    }

    const hashPayload = [
      transactionId, entry.accountId, entry.direction, entry.baseAmountIDR,
      entry.locationId || "null", entry.unitId || "null", fixedCreatedAt, previousHash
    ].join("|");

    const entryHash = crypto.createHash("sha256").update(hashPayload).digest("hex");

    writePayloads.push({
      ref: db.collection("v3_ledger_entries").doc(),
      payload: {
        ...entry,
        accountCategory: category,
        transactionId,
        createdByUid: createdByUid || null,
        createdAt: Timestamp.fromDate(logicalDate),
        immutable: true,
        previousHash,
        entryHash,
        version: 4,
      }
    });
    headHashes[scopeKey] = entryHash;
  });

  return { writePayloads, entries, transactionId };
}

/**
 * Standard wrapper (Read phase + Write phase).
 */
async function createLedgerEntriesInternal(params, batch) {
  const { writePayloads, entries, transactionId } = await getLedgerUpdatePayload(params, batch);

  // Write Entries
  writePayloads.forEach(wp => batch.set(wp.ref, wp.payload));
  // Update Sharded Balances
  updateBalanceShards(batch, entries, transactionId);

  logger.info("Ledger entries committed", { correlationId: transactionId });
}

/**
 * Callable: adminVerifyLedgerChain
 * Verifies hashes per account scope. Scans limited window.
 */
exports.adminVerifyLedgerChain = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo"]);

  const { accountId, locationId, unitId, limit = 1000 } = request.data || {};
  if (!accountId) throw new HttpsError("invalid-argument", "accountId required.");

  const constrainedLimit = enforceQueryLimits("v3_ledger_entries", { limit });

  logger.info("Initializing ledger chain verification", {
    module: "LEDGER",
    action: "VERIFY_CHAIN",
    uid,
    metadata: { accountId, limit: constrainedLimit }
  });

  let q = db.collection("v3_ledger_entries")
    .where("accountId", "==", accountId)
    .where("locationId", "==", locationId || null)
    .where("unitId", "==", unitId || null)
    .orderBy("createdAt", "asc")
    .limit(constrainedLimit);

  const snap = await q.get();
  const crypto = require("crypto");
  let lastHash = "0000000000000000000000000000000000000000000000000000000000000000";

  for (const doc of snap.docs) {
    const e = doc.data();

    // Recalculate hash
    const hashPayload = [
      e.transactionId,
      e.accountId,
      e.direction,
      e.baseAmountIDR,
      e.locationId || "null",
      e.unitId || "null",
      e.createdAt.toDate().toISOString(),
      e.previousHash
    ].join("|");

    const reHash = crypto.createHash("sha256").update(hashPayload).digest("hex");

    if (e.entryHash !== reHash || e.previousHash !== lastHash) {
      logger.error("Ledger tampering detected during chain verify", {
        module: "LEDGER",
        action: "TAMPER_DETECTED",
        metadata: { docId: doc.id, accountId }
      });
      return {
        verified: false,
        error: "HASH_MISMATCH",
        docId: doc.id,
        expected: reHash,
        found: e.entryHash,
        previousExpected: lastHash,
        previousFound: e.previousHash
      };
    }
    lastHash = e.entryHash;
  }

  return { verified: true, entriesScanned: snap.size };
});

/**
 * Callable: Get balance for an account in a given scope
 */
exports.getLedgerBalance = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);

  const { accountId, locationId, unitId } = request.data || {};
  if (!accountId) throw new HttpsError("invalid-argument", "accountId is required.");

  requireRole(user, ["admin", "ceo", "finance_officer", "location_manager", "investor", "shark"]);
  requireLocationScope(user, locationId);
  requireUnitScope(user, unitId);

  let q = db.collection("v3_account_balance_shards")
    .where("accountId", "==", accountId)
    .where("locationId", "==", locationId || null)
    .where("unitId", "==", unitId || null);

  const snap = await q.get();
  if (snap.empty) {
    return { accountId, locationId, unitId, balance: 0, debitTotal: 0, creditTotal: 0, status: "NO_DATA" };
  }

  let debit = 0;
  let credit = 0;
  snap.forEach(doc => {
    const d = doc.data();
    debit += Number(d.debitTotal || 0);
    credit += Number(d.creditTotal || 0);
  });

  return {
    accountId,
    locationId: locationId || null,
    unitId: unitId || null,
    debitTotal: debit,
    creditTotal: credit,
    balance: debit - credit,
    shardCount: snap.size
  };
});

module.exports = {
  createLedgerEntriesInternal,
  getLedgerUpdatePayload,
  updateBalanceShards,
  createLedgerEntriesHelper: createLedgerEntriesInternal,
  adminVerifyLedgerChain: exports.adminVerifyLedgerChain,
  getLedgerBalance: exports.getLedgerBalance,
};
