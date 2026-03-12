# OPS3 Hub Receiving Defect Fix

**Author:** Manus AI
**Date:** 2026-03-12
**Status:** ✅ Resolved

## 1. Overview

During the OPS3 Phase 3.3 operational simulation, a critical defect was discovered in the `hubReceiving.js` module. Hub confirmations were failing silently, posting a `hub_receive_from_boat` document request that the `documentProcessor` trigger would ignore. This resulted in `inventory_states` not being updated, causing a silent failure in the inventory system.

Two distinct issues were identified and resolved:
1.  An incorrect HMAC computation and the use of the `hmac` field instead of `idempotency_key` in the `document_request`.
2.  A mismatch in the `inventory_states` scope key format between the simulation test's seeding function and the `documentProcessor`'s lookup logic.

## 2. Root Cause Analysis

### Defect 1: HMAC vs. Idempotency Key

The `documentProcessor` ledger engine uses an idempotency lock mechanism based on the `idempotency_key` field of a `document_request`. The `hubReceiving.confirmHubReceiving` function was incorrectly generating the HMAC and sending it in an `hmac` field.

Furthermore, the HMAC generation in `hubReceiving.js` did not match the double-hash pattern expected by the `documentProcessor`. The processor calculates the HMAC over a SHA256 hash of the payload, whereas `hubReceiving.js` was hashing the payload directly.

This mismatch caused the `documentProcessor` to calculate a different HMAC, fail to find a matching `document_request` to process, and silently discard the request.

### Defect 2: Inventory Scope Key Mismatch

After fixing the idempotency key issue, Scenarios 1 and 2 of the simulation test still failed. The `documentProcessor` trigger was firing but reported that the boat had zero inventory, even though the test had seeded it with 200kg of `tuna-raw`.

The investigation revealed a mismatch in the document key format for `inventory_states`:

*   **`documentProcessor.js` expects:** `${location_id}__${unit_id}__${sku_id}`
*   **`test_p33_operational_simulation.js` was using:** `${company_id}__${location_id}__${unit_id}__${sku_id}`

Because the `company_id` prefix was included in the seeded document's key, the `documentProcessor`'s lookup for the boat's inventory failed, resulting in the `HUB_RECEIVE_OVERCOUNT` error.

## 3. Resolution

### Fix 1: Corrected Idempotency Key and HMAC Generation

The `hubReceiving.js` module was updated to use the `idempotency_key` field and generate the HMAC digest using the correct double-hash pattern.

**File:** `functions/lib/hubReceiving.js`

```javascript
// OLD CODE
const hmac = crypto.createHmac("sha256", process.env.HMAC_SECRET).update(JSON.stringify(payloadData)).digest("hex");
await db.collection("document_requests").doc(hmac).set({
    ...payloadData,
    lines,
    hmac,
    nonce,
});

// NEW CODE
const payloadString = JSON.stringify({ ...payloadData, lines });
const payloadHash = crypto.createHash("sha256").update(payloadString).digest("hex");
const idempotencyKey = crypto.createHmac("sha256", process.env.HMAC_SECRET).update(payloadHash + nonce).digest("hex");

await db.collection("document_requests").doc(idempotencyKey).set({
    ...payloadData,
    lines,
    idempotency_key: idempotencyKey,
    nonce,
});
```

### Fix 2: Aligned Inventory Scope Key

The `seedInventory` and `getInventory` helper functions within the simulation test script were modified to use the correct key format, omitting the `company_id` prefix.

**File:** `scripts/test_p33_operational_simulation.js`

```javascript
// OLD CODE
async function seedInventory(unitId, sku, qty, costPerUnit = 15.0) {
    const scopeKey = `${COMPANY_ID}__${LOCATION_ID}__${unitId}__${sku}`;
    // ...
}

// NEW CODE
async function seedInventory(unitId, sku, qty, costPerUnit = 15.0) {
    const scopeKey = `${LOCATION_ID}__${unitId}__${sku}`;
    // ...
}
```

Additionally, assertions were updated to reference the correct `current_balance` field instead of the old `qty_on_hand` field.

## 4. Validation

The successful resolution of these defects was confirmed by the following test results:

*   **Phase 2 Hub Receiving Test:** 44/44 assertions passed.
*   **Phase 3 E2E Operational Test:** 62/62 assertions passed.
*   **Phase 3.3 Operational Simulation Test:** 66/66 assertions passed across all 6 scenarios.

The system now correctly processes hub receiving events and updates inventory states as expected.
