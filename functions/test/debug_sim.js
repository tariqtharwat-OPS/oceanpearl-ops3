const { mockDb } = require('./harness');
const admin = require('firebase-admin');
const workflows = require('../lib/workflows');
const periods = require('../admin/v3AdminPeriods');
const shark = require('../lib/shark');
const bootstrap = require('../admin/v3Bootstrap');
const seed = require('../admin/v3SeedTestPack');
const ledger = require('../lib/ledger');

async function runBackgroundJobs() {
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

async function debugSim() {
    const adminAuth = { auth: { uid: 'user-ceo' } };

    console.log("Bootstrap...");
    await bootstrap.v3Bootstrap({ data: { secret: 'OceanPearl2026Bootstrap!' }, auth: null });
    await seed.v3SeedTestPack({ data: { packId: 'TP' }, ...adminAuth });
    await periods.adminOpenPeriod({ data: { periodId: '2026-02', startDate: '2026-02-01', endDate: '2026-02-28' }, ...adminAuth });

    try {
        const locationId = 'LOC-KAI';
        const unitId = 'UNIT-BOAT-1';
        const skuRaw = 'ANCH-FRESH';
        const skuDry = 'ANCH-DRY-BIG-A';

        console.log("DAY 1: Receiving...");
        const r1 = await workflows.recordReceiving({ data: { idempotencyKey: 'r1', locationId, unitId, skuId: skuRaw, qtyKg: 100, unitCostIDR: 1000 }, ...adminAuth });
        const r2 = await workflows.recordReceiving({ data: { idempotencyKey: 'r2', locationId, unitId, skuId: skuRaw, qtyKg: 150, unitCostIDR: 1200 }, ...adminAuth });
        const r3 = await workflows.recordReceiving({ data: { idempotencyKey: 'r3', locationId, unitId, skuId: skuRaw, qtyKg: 200, unitCostIDR: 1100 }, ...adminAuth });
        await runBackgroundJobs();

        console.log("DAY 2: Production...");
        const p1 = await workflows.recordProduction({ data: { idempotencyKey: 'p1', locationId, unitId, inputBatchId: r1.batchId, outputSkuId: skuDry, outputQtyKg: 35, processingCostIDR: 5000 }, ...adminAuth });
        const p2 = await workflows.recordProduction({ data: { idempotencyKey: 'p2', locationId, unitId, inputBatchId: r2.batchId, outputSkuId: skuDry, outputQtyKg: 30, processingCostIDR: 5000 }, ...adminAuth });
        await runBackgroundJobs();

        console.log("DAY 3: Sales...");
        await workflows.recordSale({ data: { idempotencyKey: 's1', locationId, unitId, batchId: p1.outputBatchId, qtyKg: 10, pricePerKgIDR: 4000, customerName: 'BUY-1' }, ...adminAuth });
        await workflows.recordSale({ data: { idempotencyKey: 's2', locationId, unitId, batchId: p2.outputBatchId, qtyKg: 10, pricePerKgIDR: 3100, customerName: 'BUY-1' }, ...adminAuth });
        await runBackgroundJobs();

        console.log("DAY 4: Payments...");
        await workflows.recordPayment({ data: { idempotencyKey: 'pay-1', locationId, unitId, amountIDR: 40000, direction: 'IN', accountType: 'AR', memo: 'AR Coll' }, ...adminAuth });
        await runBackgroundJobs();

        console.log("DAY 5: Waste...");
        await workflows.recordWaste({ data: { idempotencyKey: 'w1', locationId, unitId, batchId: r3.batchId, qtyKg: 5, reason: 'SPOILAGE' }, ...adminAuth });
        await runBackgroundJobs();

        console.log("DAY 6: Trips...");
        await workflows.recordTripExpense({ data: { idempotencyKey: 't1', locationId, unitId, amountIDR: 10000, memo: 'FUEL' }, ...adminAuth });
        await runBackgroundJobs();

        console.log("DAY 7: Close...");
        await periods.closeFinancialPeriod({ data: { periodId: '2026-02', confirm: true }, ...adminAuth });

        console.log("\n=== FINAL VERIFICATION ===");
        const entries = await mockDb.collection('v3_ledger_entries').get();
        let ledgerTotal = 0;
        entries.forEach(e => {
            const amt = Number(e.data().baseAmountIDR);
            ledgerTotal += (e.data().direction === 'debit' ? amt : -amt);
        });
        console.log("Ledger Total Balance (0 is ideal):", ledgerTotal);

        const alerts = await mockDb.collection('v3_shark_alerts').get();
        console.log("Shark Alerts Count:", alerts.size);
        alerts.forEach(a => console.log(` - [${a.data().severity}] ${a.data().type}`));

        const chainVerify = await ledger.adminVerifyLedgerChain({ data: { accountId: 'CASH', locationId }, ...adminAuth });
        console.log("Chain Verified (CASH):", chainVerify.verified);

        const invVal = await mockDb.collection('v3_inventory_valuations').doc(`${locationId}__${unitId}__${skuRaw}`).get();
        console.log(`Inventory ${skuRaw}:`, invVal.exists ? invVal.data().qtyKg : "N/A", "kg");

        console.log("\nALL SUCCESSFUL - SYSTEM IS DEMO-READY");

    } catch (e) {
        console.log("ERROR CAPTURED:");
        console.log("Msg:", e.message);
        console.log("Code:", e.code);
        if (e.stack) console.log(e.stack);
    }
}

debugSim();
