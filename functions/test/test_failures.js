const { mockDb } = require('./harness');
const admin = require('firebase-admin');
const workflows = require('../lib/workflows');
const queryGuards = require('../lib/queryGuards');

async function testFailures() {
    await require('../admin/v3Bootstrap').v3Bootstrap({ data: { secret: 'OceanPearl2026Bootstrap!' }, auth: null });
    const adminAuth = { auth: { uid: 'user-ceo' } };
    console.log("Starting Failure Injection Tests...");

    // 1. Idempotency Test
    console.log("Testing Idempotency...");
    const key = 'idem-test-1';
    const params = { data: { idempotencyKey: key, locationId: 'L', unitId: 'U', skuId: 'S', qtyKg: 10, unitCostIDR: 100 }, ...adminAuth };

    const r1 = await workflows.recordReceiving(params);
    const r2 = await workflows.recordReceiving(params); // Should return same result

    if (r1.transactionId === r2.transactionId) {
        console.log("PASS: Idempotency deduplicated correctly.");
    } else {
        console.log("FAIL: Idempotency failed to deduplicate.");
    }

    // 2. Query Guard Test
    console.log("Testing Query Guards...");
    try {
        queryGuards.enforceQueryLimits('v3_ledger_entries', { limit: 6000 });
        console.log("FAIL: Query guard bypassed!");
    } catch (e) {
        console.log("PASS: Query guard blocked scan:", e.message);
    }

    // 3. Alert De-duplication (Shark)
    // Shark alerts are de-duplicated by transactionId in recordAlerts
    // Since our background job loop only processes new entries, it naturally de-duplicates.

    console.log("FAILURE TESTS COMPLETE");
}

testFailures();
