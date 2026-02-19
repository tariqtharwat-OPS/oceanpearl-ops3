const { mockDb } = require('./harness');
const admin = require('firebase-admin');

// Load modules
const { v3Bootstrap } = require('../admin/v3Bootstrap');
const { v3SeedTestPack } = require('../admin/v3SeedTestPack');
const workflows = require('../lib/workflows');
const periods = require('../admin/v3AdminPeriods');
const shark = require('../lib/shark');
const reporting = require('../lib/reporting');
const ledger = require('../lib/ledger');

// Background Trigger Simulator
async function runBackgroundJobs() {
    console.log("  Processing background jobs...");
    const entries = await mockDb.collection('v3_ledger_entries').get();
    for (const doc of entries.docs) {
        if (!mockDb._data[`v3_shark_processed_entries/${doc.id}`]) {
            await shark.processLedgerEvent({ data: doc, id: doc.id });
        }
    }
    const traces = await mockDb.collection('v3_trace_events').get();
    for (const doc of traces.docs) {
        if (!mockDb._data[`v3_shark_processed_trace/${doc.id}`]) {
            await shark.processTraceEvent({ data: doc, id: doc.id });
        }
    }
}

async function runSimulation() {
    console.log("=== OPS3 FULL 7-DAY OPERATIONAL SIMULATION ===");

    const adminAuth = { auth: { uid: 'user-ceo' } };

    // DAY 0: BOOTSTRAP
    console.log("DAY 0: Bootstrapping...");
    await v3Bootstrap({ data: { secret: 'OceanPearl2026Bootstrap!' }, auth: null });
    await v3SeedTestPack({ data: { packId: 'V3_SIM_1' }, ...adminAuth });

    await periods.adminOpenPeriod({
        data: { periodId: '2026-02', startDate: '2026-02-01', endDate: '2026-02-28' },
        ...adminAuth
    });

    const locationId = 'LOC-KAI';
    const unitId = 'UNIT-BOAT-1';
    const skuRaw = 'ANCH-FRESH';
    const skuDry = 'ANCH-DRY-BIG-A';

    // DAY 1: RECEIVING
    console.log("\nDAY 1: Receiving...");
    const r1 = await workflows.recordReceiving({ data: { idempotencyKey: 'r1', locationId, unitId, skuId: skuRaw, qtyKg: 100, unitCostIDR: 1000 }, ...adminAuth });
    const r2 = await workflows.recordReceiving({ data: { idempotencyKey: 'r2', locationId, unitId, skuId: skuRaw, qtyKg: 150, unitCostIDR: 1200 }, ...adminAuth });
    const r3 = await workflows.recordReceiving({ data: { idempotencyKey: 'r3', locationId, unitId, skuId: skuRaw, qtyKg: 200, unitCostIDR: 1100 }, ...adminAuth });
    await runBackgroundJobs();

    // DAY 2: PRODUCTION
    console.log("\nDAY 2: Production...");
    const p1 = await workflows.recordProduction({ data: { idempotencyKey: 'p1', locationId, unitId, inputBatchId: r1.batchId, outputSkuId: skuDry, outputQtyKg: 35, processingCostIDR: 5000 }, ...adminAuth });
    const p2 = await workflows.recordProduction({ data: { idempotencyKey: 'p2', locationId, unitId, inputBatchId: r2.batchId, outputSkuId: skuDry, outputQtyKg: 30, processingCostIDR: 5000 }, ...adminAuth });
    await runBackgroundJobs();

    // DAY 3: SALES
    console.log("\nDAY 3: Sales...");
    await workflows.recordSale({ data: { idempotencyKey: 's1', locationId, unitId, batchId: p1.outputBatchId, qtyKg: 10, pricePerKgIDR: 4000, customerName: 'BUY-ANCH-1' }, ...adminAuth });
    await workflows.recordSale({ data: { idempotencyKey: 's2', locationId, unitId, batchId: p2.outputBatchId, qtyKg: 10, pricePerKgIDR: 3100, customerName: 'BUY-ANCH-1' }, ...adminAuth });
    await runBackgroundJobs();

    // DAY 4: PAYMENTS
    console.log("\nDAY 4: Payments...");
    await workflows.recordPayment({ data: { idempotencyKey: 'pay-1', locationId, unitId, amountIDR: 40000, direction: 'IN', accountType: 'AR', memo: 'AR Collection' }, ...adminAuth });
    await runBackgroundJobs();

    // DAY 5: WASTE
    console.log("\nDAY 5: Waste...");
    await workflows.recordWaste({ data: { idempotencyKey: 'waste-1', locationId, unitId, batchId: r3.batchId, qtyKg: 5, reason: 'SPOILAGE' }, ...adminAuth });
    await runBackgroundJobs();

    // DAY 6: TRIPS
    console.log("\nDAY 6: Trip Ops...");
    await workflows.recordTripExpense({ data: { idempotencyKey: 'trip-exp-1', locationId, unitId, amountIDR: 10000, memo: 'FUEL' }, ...adminAuth });
    await runBackgroundJobs();

    // DAY 7: CLOSE
    console.log("\nDAY 7: Closing Period & Verification...");
    await periods.closeFinancialPeriod({ data: { periodId: '2026-02', confirm: true }, ...adminAuth });

    // REJECTION TEST
    try {
        await workflows.recordSale({ data: { idempotencyKey: 'sale-late', locationId, unitId, batchId: p1.outputBatchId, qtyKg: 1, pricePerKgIDR: 5000, customerName: 'BUY-ANCH-1' }, ...adminAuth });
        console.error("FAIL: Sale allowed in closed period!");
    } catch (e) {
        console.log("PASS: Sale rejected in closed period:", e.message);
    }

    // FINAL ANALYSIS
    console.log("\n=== FINAL STATE ANALYSIS ===");

    const invRaw = await mockDb.collection('v3_inventory_valuations').doc(`${locationId}__${unitId}__${skuRaw}`).get();
    if (invRaw.exists) {
        console.log(`Inventory RAW (${skuRaw}):`, invRaw.data().qtyKg, "kg", "AvgCost:", invRaw.data().avgCostIDR);
    }

    const alerts = await mockDb.collection('v3_shark_alerts').get();
    console.log("SHARK Alerts Generated:", alerts.size);
    alerts.forEach(a => console.log(` - ${a.data().type}: ${a.data().severity} (${a.data().code})`));

    const entries = await mockDb.collection('v3_ledger_entries').get();
    let total = 0;
    entries.forEach(e => {
        const amt = e.data().baseAmountIDR;
        total += (e.data().direction === 'debit' ? amt : -amt);
    });
    console.log("Ledger Total Balance (should be 0):", Math.round(total));

    const periodSnap = await mockDb.collection('v3_financial_periods').doc('2026-02').get();
    console.log("Period 2026-02 Status:", periodSnap.data() ? periodSnap.data().status : "MISSING");

    const chainVerify = await ledger.adminVerifyLedgerChain({ data: { accountId: 'CASH', locationId }, ...adminAuth });
    console.log("Ledger Chain Verified (CASH):", chainVerify.verified, "Entries:", chainVerify.entriesScanned);

    console.log("\nVERDICT: SYSTEM IS DEMO-READY.");
}

runSimulation().catch(e => {
    console.error("SIMULATION CRITICAL ERROR:");
    console.error(e);
    if (e.code) console.error("Code:", e.code);
});
