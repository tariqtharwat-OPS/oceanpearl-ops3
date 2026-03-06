/**
 * OPS V3 - Operational Workflows (SECURED)
 *
 * All business events flow through workflows.
 * Workflows are the ONLY approved path to mutate:
 *  - wallet_events (via internal ledger helper)
 *  - inventory_events (via internal inventory helper)
 *  - audit_logs / documents (traceability)
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

const { createLedgerEntriesInternal, getLedgerUpdatePayload, updateBalanceShards } = require("./ledger");
const { updateInventoryValuation, getInventoryUpdatePayload } = require("./inventory");

const {
  requireAuth,
  getUserProfile,
  requireRole,
  requireLocationScope,
  requireUnitScope,
} = require("./auth");

const { withIdempotency } = require("./idempotency");
const logger = require("./logger");

// --------------------------
// Helpers
// --------------------------
function requirePositiveNumber(v, name) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new HttpsError("invalid-argument", `${name} must be > 0`);
  return n;
}

async function createTraceEvent(transaction, event) {
  const ref = db.collection("audit_logs").doc();
  transaction.set(ref, {
    ...event,
    createdAt: FieldValue.serverTimestamp(),
    version: 3,
  });
  return ref.id;
}

// --------------------------
// Workflow: Receiving (Raw Fish)
// Creates a Batch (for QR) and books inventory + ledger
// --------------------------
exports.recordReceiving = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "location_manager", "unit_operator"]);

  const { idempotencyKey, locationId, unitId, skuId, qtyKg, unitCostIDR, supplierName, vesselName } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (!locationId || !unitId || !skuId) throw new HttpsError("invalid-argument", "locationId, unitId, skuId required.");
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    const qty = requirePositiveNumber(qtyKg, "qtyKg");
    const cost = requirePositiveNumber(unitCostIDR, "unitCostIDR");
    const total = Math.round(qty * cost);

    const batchId = idempotencyKey;
    const transactionId = `recv_${idempotencyKey}`;
    const batchRef = db.collection("documents").doc(batchId);

    // --- PHASE 1: ALL READS ---
    const bSnap = await transaction.get(batchRef);
    const invData = await getInventoryUpdatePayload({ locationId, unitId, skuId, deltaQtyKg: qty, newAvgCostIDR: cost }, transaction);

    const entries = [
      { accountId: "INV_RAW_FISH", direction: "debit", baseAmountIDR: total, locationId, unitId, meta: { skuId, qtyKg: qty, batchId } },
      { accountId: "AP_SUPPLIER", direction: "credit", baseAmountIDR: total, locationId, unitId, meta: { supplierName: supplierName || null, batchId } },
    ];
    const ledgData = await getLedgerUpdatePayload({ transactionId, entries, createdByUid: uid }, transaction);

    // --- PHASE 2: ALL WRITES ---
    transaction.set(batchRef, {
      batchId,
      locationId,
      unitId,
      skuId,
      qtyKg: qty,
      unitCostIDR: cost,
      status: "RECEIVED",
      supplierName: supplierName || null,
      vesselName: vesselName || null,
      createdByUid: uid,
      createdAt: FieldValue.serverTimestamp(),
      version: 3,
    });

    // Commit inventory
    transaction.set(invData.ref, invData.payload, { merge: true });

    // Commit ledger
    ledgData.writePayloads.forEach(wp => transaction.set(wp.ref, wp.payload));
    updateBalanceShards(transaction, ledgData.entries, transactionId);

    // Trace event
    await createTraceEvent(transaction, { type: "RECEIVING", batchId, locationId, unitId, skuId, qtyKg: qty, transactionId });

    return {
      ok: true,
      transactionId,
      batchId,
      qrPayload: { batchId, v: 3 },
    };
  });
});

// --------------------------
// Workflow: Production (e.g., drying / processing) transforms input batch -> output batch
// --------------------------
exports.recordProduction = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "location_manager", "unit_operator"]);

  // Support both legacy single-output and new multi-output
  const { idempotencyKey, locationId, unitId, inputBatchId, outputSkuId, outputQtyKg, processingCostIDR, outputs } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (!locationId || !unitId || !inputBatchId) {
      throw new HttpsError("invalid-argument", "locationId, unitId, inputBatchId required.");
    }
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    // Normalize outputs
    let outputList = [];
    if (outputs && Array.isArray(outputs) && outputs.length > 0) {
      outputList = outputs;
    } else if (outputSkuId && outputQtyKg) {
      outputList = [{ skuId: outputSkuId, qtyKg: outputQtyKg }];
    } else {
      throw new HttpsError("invalid-argument", "Either 'outputs' array or 'outputSkuId'/'outputQtyKg' required.");
    }

    const procCost = Math.max(0, Math.round(Number(processingCostIDR || 0)));

    // Validate strict positive numbers
    let totalOutQty = 0;
    outputList.forEach((o, i) => {
      o.qty = requirePositiveNumber(o.qtyKg, `outputs[${i}].qtyKg`);
      totalOutQty += o.qty;
    });

    // --- PHASE 1: ALL READS ---
    const inputSnap = await transaction.get(db.collection("documents").doc(inputBatchId));
    if (!inputSnap.exists) throw new HttpsError("not-found", "inputBatch not found.");
    const input = inputSnap.data() || {};
    if (input.locationId !== locationId || input.unitId !== unitId) throw new HttpsError("permission-denied", "Batch scope mismatch.");

    const inQty = Number(input.qtyKg || 0);
    if (totalOutQty > inQty + 0.1) { // Floating point tolerance
      // Technically receiving might use 'weight gain' (soaking)? 
      // Start with strict check, but user might need override. 
      // For now, strict: Output <= Input is standard unless additive processing.
      // Prompt says "multi-output co-products". 
      // If total outputs < input, it is yield loss.
      // If total outputs > input, it is technically impossible without additives. Block for now.
      throw new HttpsError("failed-precondition", `Output (${totalOutQty}) cannot exceed input (${inQty}).`);
    }

    const lossQty = inQty - totalOutQty;
    const transactionId = `prod_${idempotencyKey}`;

    const base = Math.round(inQty * Number(input.unitCostIDR || 0));
    const totalCostToAllocate = base + procCost;

    // Cost Allocation: Uniform per Kg (Physical Allocation)
    // If we have outputs, cost/kg = totalCost / totalOutputQty
    const outputCostPerKg = Math.round(totalCostToAllocate / totalOutQty);

    // Prepare Inventory Validations & Updates
    const invUpdates = [];
    // Input consumption
    invUpdates.push(await getInventoryUpdatePayload({ locationId, unitId, skuId: String(input.skuId), deltaQtyKg: -inQty }, transaction));

    // Output creations
    for (const o of outputList) {
      invUpdates.push(await getInventoryUpdatePayload({ locationId, unitId, skuId: o.skuId, deltaQtyKg: o.qty, newAvgCostIDR: outputCostPerKg }, transaction));
    }

    // Ledger Entries
    const entries = [];
    // Credit Raw Materials (Input)
    entries.push({ accountId: "INV_RAW_FISH", direction: "credit", baseAmountIDR: Math.max(0, base), locationId, unitId, meta: { inputBatchId, inQtyKg: inQty } });

    // Debit Finished Goods (Outputs) - Split by SKU
    // Note: Due to rounding, sum(debits) might differ slightly from sum(credits) + procCost. 
    // We must balance exactly.
    let allocatedTotal = 0;
    outputList.forEach((o, i) => {
      const isLast = i === outputList.length - 1;
      let val = Math.round(o.qty * outputCostPerKg);
      if (isLast) {
        // Force balance check: TotalDebits = TotalCredits (base + procCost)
        val = totalCostToAllocate - allocatedTotal;
      }
      allocatedTotal += val;

      entries.push({
        accountId: "INV_FINISHED",
        direction: "debit",
        baseAmountIDR: Math.max(0, val),
        locationId,
        unitId,
        meta: { outputSkuId: o.skuId, outputQtyKg: o.qty, batchSuffix: i }
      });
    });

    if (procCost > 0) {
      entries.push({ accountId: "COGS_PROCESSING", direction: "debit", baseAmountIDR: procCost, locationId, unitId, meta: { inputBatchId } });
      entries.push({ accountId: "CASH_OR_AP", direction: "credit", baseAmountIDR: procCost, locationId, unitId, meta: { inputBatchId } });
    }

    const ledgData = await getLedgerUpdatePayload({ transactionId, entries, createdByUid: uid }, transaction);

    // --- PHASE 2: ALL WRITES ---
    // Update Input Batch
    transaction.set(db.collection("documents").doc(inputBatchId), {
      status: "CONSUMED",
      consumedByTransactionId: transactionId,
      consumedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // Create Output Batches
    const createdBatchIds = [];
    outputList.forEach((o, i) => {
      const outputBatchId = `${idempotencyKey}_${i + 1}`;
      createdBatchIds.push(outputBatchId);

      transaction.set(db.collection("documents").doc(outputBatchId), {
        batchId: outputBatchId,
        parentBatchId: inputBatchId,
        locationId,
        unitId,
        skuId: o.skuId,
        qtyKg: o.qty,
        unitCostIDR: outputCostPerKg,
        status: "PRODUCED",
        createdByUid: uid,
        createdAt: FieldValue.serverTimestamp(),
        version: 3,
        // lineage: store direct parent for easy trace?
        lineage: { inputBatchId, processingId: transactionId }
      });
    });

    // Commit Inventory
    invUpdates.forEach(u => transaction.set(u.ref, u.payload, { merge: true }));

    // Commit Ledger
    ledgData.writePayloads.forEach(wp => transaction.set(wp.ref, wp.payload));
    updateBalanceShards(transaction, ledgData.entries, transactionId);

    // Trace event
    await createTraceEvent(transaction, {
      type: "PRODUCTION",
      inputBatchId,
      outputBatchIds: createdBatchIds,
      locationId,
      unitId,
      transactionId,
      lossQtyKg: lossQty,
      inputQtyKg: inQty,
      totalOutputQtyKg: totalOutQty
    });

    return { ok: true, transactionId, createdBatchIds };
  });
});

// --------------------------
// Workflow: Transfer batch
// --------------------------
exports.recordTransfer = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "location_manager"]);

  const { idempotencyKey, fromLocationId, fromUnitId, toLocationId, toUnitId, batchId } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (!fromLocationId || !fromUnitId || !toLocationId || !toUnitId || !batchId) {
      throw new HttpsError("invalid-argument", "from/to location/unit and batchId required.");
    }
    requireLocationScope(user, fromLocationId);
    requireUnitScope(user, fromUnitId);

    // --- PHASE 1: ALL READS ---
    const bSnap = await transaction.get(db.collection("documents").doc(batchId));
    if (!bSnap.exists) throw new HttpsError("not-found", "batch not found.");
    const b = bSnap.data() || {};
    if (b.locationId !== fromLocationId || b.unitId !== fromUnitId) throw new HttpsError("failed-precondition", "Batch not at source scope.");
    const qty = Number(b.qtyKg || 0);
    const skuId = String(b.skuId || "");

    const transactionId = `xfer_${idempotencyKey}`;

    // Prepare Inventory
    const invFromData = await getInventoryUpdatePayload({ locationId: fromLocationId, unitId: fromUnitId, skuId, deltaQtyKg: -qty }, transaction);
    const invToData = await getInventoryUpdatePayload({ locationId: toLocationId, unitId: toUnitId, skuId, deltaQtyKg: qty }, transaction);

    // Prepare Ledger
    const entries = [
      { accountId: "INV_IN_TRANSIT", direction: "debit", baseAmountIDR: 1, locationId: fromLocationId, unitId: fromUnitId, meta: { batchId } },
      { accountId: "INV_IN_TRANSIT", direction: "credit", baseAmountIDR: 1, locationId: toLocationId, unitId: toUnitId, meta: { batchId } },
    ];
    const ledgData = await getLedgerUpdatePayload({ transactionId, entries, createdByUid: uid }, transaction);

    // --- PHASE 2: ALL WRITES ---
    transaction.set(db.collection("documents").doc(batchId), {
      locationId: toLocationId,
      unitId: toUnitId,
      lastTransfer: { fromLocationId, fromUnitId, toLocationId, toUnitId, at: FieldValue.serverTimestamp(), by: uid },
    }, { merge: true });

    // Commit Inventory
    transaction.set(invFromData.ref, invFromData.payload, { merge: true });
    transaction.set(invToData.ref, invToData.payload, { merge: true });

    // Commit Ledger
    ledgData.writePayloads.forEach(wp => transaction.set(wp.ref, wp.payload));
    updateBalanceShards(transaction, ledgData.entries, transactionId);

    // Trace event
    await createTraceEvent(transaction, { type: "TRANSFER", batchId, fromLocationId, fromUnitId, toLocationId, toUnitId, transactionId });

    return { ok: true, transactionId };
  });
});

// --------------------------
// Workflow: Trip expense
// --------------------------
exports.recordTripExpense = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "location_manager", "finance_officer"]);

  const { idempotencyKey, locationId, unitId, tripId, amountIDR, memo } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (!locationId || !unitId) throw new HttpsError("invalid-argument", "locationId, unitId required.");
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    const amt = requirePositiveNumber(amountIDR, "amountIDR");
    const transactionId = `trip_${idempotencyKey}`;

    const entries = [
      { accountId: "TRIP_EXPENSES", direction: "debit", baseAmountIDR: amt, locationId, unitId, meta: { memo: memo || null } },
      { accountId: "CASH_OR_AP", direction: "credit", baseAmountIDR: amt, locationId, unitId, meta: { memo: memo || null } },
    ];

    await createLedgerEntriesInternal({ transactionId, entries, createdByUid: uid }, transaction);

    const traceRef = db.collection("audit_logs").doc();
    transaction.set(traceRef, {
      type: "TRIP_EXPENSE",
      locationId,
      unitId,
      tripId: tripId || null,
      amountIDR: amt,
      memo: memo || null,
      transactionId,
      createdAt: FieldValue.serverTimestamp(),
      version: 3
    });

    return { ok: true, transactionId };
  });
});

// --------------------------
// Workflow: Trip Start
// --------------------------
exports.recordTripStart = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "location_manager", "unit_operator"]);

  const { idempotencyKey, locationId, unitId, vesselName } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (!locationId || !unitId) throw new HttpsError("invalid-argument", "locationId, unitId required.");
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    const tripId = `TRIP-${idempotencyKey}`;
    const tripRef = db.collection("documents").doc(tripId);

    transaction.set(tripRef, {
      tripId,
      locationId,
      unitId,
      vesselName: vesselName || null,
      status: "ACTIVE",
      startedAt: FieldValue.serverTimestamp(),
      startedByUid: uid,
      version: 3
    });

    return { ok: true, tripId };
  });
});

// --------------------------
// Workflow: Sale of finished goods
// --------------------------
exports.recordSale = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "location_manager", "finance_officer"]);

  const { idempotencyKey, locationId, unitId, batchId, qtyKg, pricePerKgIDR, customerName, paymentType } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    console.log(`[recordSale] Starting sale for batch ${batchId}`, { locationId, unitId, qtyKg, pricePerKgIDR });
    if (!locationId || !unitId || !batchId) throw new HttpsError("invalid-argument", "locationId, unitId, batchId required.");
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    const qty = requirePositiveNumber(qtyKg, "qtyKg");
    const price = requirePositiveNumber(pricePerKgIDR, "pricePerKgIDR");
    const revenue = Math.round(qty * price);

    // --- PHASE 1: ALL READS ---
    const bSnap = await transaction.get(db.collection("documents").doc(batchId));
    if (!bSnap.exists) throw new HttpsError("not-found", "batch not found.");
    const b = bSnap.data();
    if (b.locationId !== locationId || b.unitId !== unitId) throw new HttpsError("permission-denied", "Batch scope mismatch.");
    if (b.status === "SOLD") throw new HttpsError("failed-precondition", "Batch already sold.");

    const unitCost = Number(b.unitCostIDR || 0);
    const cogs = Math.round(qty * unitCost);
    const skuId = b.skuId;

    const transactionId = `sale_${idempotencyKey}`;

    // Prepare Inventory
    const invData = await getInventoryUpdatePayload({ locationId, unitId, skuId, deltaQtyKg: -qty }, transaction);

    // Prepare Ledger
    const entries = [
      { accountId: "REVENUE", direction: "credit", baseAmountIDR: revenue, locationId, unitId, meta: { customerName, batchId, qtyKg: qty } },
      { accountId: (paymentType === "AR" ? "ACCOUNTS_RECEIVABLE" : "CASH"), direction: "debit", baseAmountIDR: revenue, locationId, unitId, meta: { customerName, batchId } },
      { accountId: "COGS", direction: "debit", baseAmountIDR: cogs, locationId, unitId, meta: { batchId, qtyKg: qty } },
      { accountId: "INV_FINISHED", direction: "credit", baseAmountIDR: cogs, locationId, unitId, meta: { batchId, qtyKg: qty } },
    ];
    const ledgData = await getLedgerUpdatePayload({ transactionId, entries, createdByUid: uid }, transaction);

    // --- PHASE 2: ALL WRITES ---
    transaction.set(db.collection("documents").doc(batchId), {
      status: "SOLD",
      sale: { customerName, pricePerKgIDR: price, qtyKg: qty, revenueIDR: revenue, transactionId, at: FieldValue.serverTimestamp() }
    }, { merge: true });

    // Commit Inventory
    transaction.set(invData.ref, invData.payload, { merge: true });

    // Commit Ledger
    ledgData.writePayloads.forEach(wp => transaction.set(wp.ref, wp.payload));
    updateBalanceShards(transaction, ledgData.entries, transactionId);

    // Trace event
    await createTraceEvent(transaction, { type: "SALE", batchId, locationId, unitId, skuId, qtyKg: qty, revenueIDR: revenue, transactionId });

    return { ok: true, transactionId, revenueIDR: revenue, totalCOGS: cogs };
  });
});

// --------------------------
// Workflow: Record Payment (Settlement)
// --------------------------
exports.recordPayment = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "finance_officer"]);

  const { idempotencyKey, locationId, unitId, amountIDR, direction, accountType, memo } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (!locationId || !unitId) throw new HttpsError("invalid-argument", "locationId, unitId required.");
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    const amt = requirePositiveNumber(amountIDR, "amountIDR");
    const transactionId = `pay_${idempotencyKey}`;

    let entries = [];
    if (direction === "IN" && accountType === "AR") {
      entries = [
        { accountId: "CASH", direction: "debit", baseAmountIDR: amt, locationId, unitId, meta: { memo } },
        { accountId: "ACCOUNTS_RECEIVABLE", direction: "credit", baseAmountIDR: amt, locationId, unitId, meta: { memo } },
      ];
    } else if (direction === "OUT" && accountType === "AP") {
      entries = [
        { accountId: "ACCOUNTS_PAYABLE", direction: "debit", baseAmountIDR: amt, locationId, unitId, meta: { memo } },
        { accountId: "CASH", direction: "credit", baseAmountIDR: amt, locationId, unitId, meta: { memo } },
      ];
    } else {
      throw new HttpsError("invalid-argument", "Unsupported payment logic combination.");
    }

    await createLedgerEntriesInternal({ transactionId, entries, createdByUid: uid }, transaction);
    return { ok: true, transactionId };
  });
});

// --------------------------
// Workflow: Record Waste / Shrink
// --------------------------
exports.recordWaste = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "location_manager", "unit_operator"]);

  const { idempotencyKey, locationId, unitId, batchId, qtyKg, reason } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (!locationId || !unitId || !batchId) throw new HttpsError("invalid-argument", "locationId, unitId, batchId required.");
    requireLocationScope(user, locationId);
    requireUnitScope(user, unitId);

    const qty = requirePositiveNumber(qtyKg, "qtyKg");
    const bRef = db.collection("documents").doc(batchId);

    // --- PHASE 1: ALL READS ---
    const bSnap = await transaction.get(bRef);
    if (!bSnap.exists) throw new HttpsError("not-found", "batch not found.");
    const b = bSnap.data();

    const unitCost = Number(b.unitCostIDR || 0);
    const lossValue = Math.round(qty * unitCost);
    const transactionId = `waste_${idempotencyKey}`;

    // Prepare Inventory
    const invData = await getInventoryUpdatePayload({ locationId, unitId, skuId: b.skuId, deltaQtyKg: -qty }, transaction);

    // Prepare Ledger
    const entries = [
      { accountId: "INVENTORY_LOSS", direction: "debit", baseAmountIDR: lossValue, locationId, unitId, meta: { batchId, reason } },
      { accountId: "INV_FINISHED", direction: "credit", baseAmountIDR: lossValue, locationId, unitId, meta: { batchId, reason } },
    ];
    const ledgData = await getLedgerUpdatePayload({ transactionId, entries, createdByUid: uid }, transaction);

    // --- PHASE 2: ALL WRITES ---
    transaction.set(bRef, {
      qtyKg: FieldValue.increment(-qty),
      wasteLog: FieldValue.arrayUnion({ qtyKg: qty, reason, at: new Date().toISOString(), by: uid })
    }, { merge: true });

    // Commit Inventory
    transaction.set(invData.ref, invData.payload, { merge: true });

    // Commit Ledger
    ledgData.writePayloads.forEach(wp => transaction.set(wp.ref, wp.payload));
    updateBalanceShards(transaction, ledgData.entries, transactionId);

    // Trace
    await createTraceEvent(transaction, { type: "WASTE", batchId, locationId, unitId, qtyKg: qty, reason, transactionId });

    return { ok: true, transactionId, lossValueIDR: lossValue };
  });
});

// --------------------------
// Workflow: Record Adjustment (Admin Only)
// --------------------------
exports.recordAdjustment = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin"]);

  const { idempotencyKey, locationId, unitId, skuId, deltaQtyKg, memo } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (!locationId || !unitId || !skuId) throw new HttpsError("invalid-argument", "locationId, unitId, skuId required.");

    const delta = Number(deltaQtyKg);
    const transactionId = `adj_${idempotencyKey}`;

    // --- PHASE 1: ALL READS ---
    const invRef = db.collection("inventory_events").doc(`${locationId}__${unitId}__${skuId}`);
    const invSnap = await transaction.get(invRef);
    const avgCost = invSnap.exists ? Number(invSnap.data().avgCostIDR || 0) : 0;
    const adjustValue = Math.abs(Math.round(delta * avgCost)) || 1;

    // Prepare Inventory
    const invData = await getInventoryUpdatePayload({ locationId, unitId, skuId, deltaQtyKg: delta }, transaction);

    // Prepare Ledger
    const direction = delta > 0 ? "debit" : "credit";
    const contraDirection = delta > 0 ? "credit" : "debit";
    const entries = [
      { accountId: "INV_FINISHED", direction: direction, baseAmountIDR: adjustValue, locationId, unitId, meta: { memo } },
      { accountId: "ADJUSTMENT_ACCOUNT", direction: contraDirection, baseAmountIDR: adjustValue, locationId, unitId, meta: { memo } },
    ];
    const ledgData = await getLedgerUpdatePayload({ transactionId, entries, createdByUid: uid }, transaction);

    // --- PHASE 2: ALL WRITES ---
    // Commit Inventory
    transaction.set(invData.ref, invData.payload, { merge: true });

    // Commit Ledger
    ledgData.writePayloads.forEach(wp => transaction.set(wp.ref, wp.payload));
    updateBalanceShards(transaction, ledgData.entries, transactionId);

    return { ok: true, transactionId, deltaQtyKg: delta };
  });
});

// --------------------------
// Workflow: Trip Clearing (Snapshot)
// --------------------------
exports.recordTripClearing = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "finance_officer", "location_manager"]);

  const { idempotencyKey, locationId, unitId, tripId } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (!locationId || !unitId || !tripId) throw new HttpsError("invalid-argument", "locationId, unitId, tripId required.");

    const summaryRef = db.collection("documents").doc(tripId);

    // We only write a summary doc. No ledger mutation as per MCP.
    transaction.set(summaryRef, {
      locationId,
      unitId,
      tripId,
      clearedAt: FieldValue.serverTimestamp(),
      clearedByUid: uid,
      status: "CLEARED",
      idempotencyKey
    }, { merge: true });

    return { ok: true, tripId, status: "CLEARED" };
  });
});
// --------------------------
// Workflow: Wallet Transfer (Cash movement between scopes)
// --------------------------
exports.recordWalletTransfer = onCall(async (request) => {
  const uid = requireAuth(request);
  const user = await getUserProfile(uid);
  requireRole(user, ["admin", "ceo", "finance_officer"]);

  const { idempotencyKey, fromLocationId, fromUnitId, toLocationId, toUnitId, amountIDR, memo } = request.data || {};

  return await withIdempotency(idempotencyKey, uid, async (transaction) => {
    if (fromLocationId === toLocationId && fromUnitId === toUnitId) {
      throw new HttpsError("invalid-argument", "Source and destination must be different.");
    }

    const amt = requirePositiveNumber(amountIDR, "amountIDR");
    const transactionId = `trf_${idempotencyKey}`;

    // Prepare Ledger: 
    // Debit destination (Cash increases)
    // Credit source (Cash decreases)
    const entries = [
      { accountId: "CASH", direction: "debit", baseAmountIDR: amt, locationId: toLocationId || null, unitId: toUnitId || null, meta: { memo, from: fromUnitId || 'HQ' } },
      { accountId: "CASH", direction: "credit", baseAmountIDR: amt, locationId: fromLocationId || null, unitId: fromUnitId || null, meta: { memo, to: toUnitId || 'HQ' } },
    ];

    await createLedgerEntriesInternal({ transactionId, entries, createdByUid: uid }, transaction);
    return { ok: true, transactionId };
  });
});

module.exports = {
  recordReceiving: exports.recordReceiving,
  recordProduction: exports.recordProduction,
  recordTransfer: exports.recordTransfer,
  recordTripExpense: exports.recordTripExpense,
  recordSale: exports.recordSale,
  recordPayment: exports.recordPayment,
  recordWaste: exports.recordWaste,
  recordAdjustment: exports.recordAdjustment,
  recordTripClearing: exports.recordTripClearing,
  recordWalletTransfer: exports.recordWalletTransfer,
  recordTripStart: exports.recordTripStart,
};
