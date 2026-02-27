const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'oceanpearl-ops' });
}
const db = admin.firestore();
const { createLedgerEntriesInternal } = require('../lib/ledger');

async function testPeriod(label, dateStr, idempotencyKey, expectedSuccess) {
    const logicalDate = new Date(dateStr);
    try {
        await db.runTransaction(async (transaction) => {
            const entries = [
                { accountId: "TRIP_EXPENSES", direction: "debit", baseAmountIDR: 1000, locationId: 'LOC-KAI', unitId: 'UNIT-BOAT-FARIS' },
                { accountId: "CASH", direction: "credit", baseAmountIDR: 1000, locationId: 'LOC-KAI', unitId: 'UNIT-BOAT-FARIS' },
            ];
            await createLedgerEntriesInternal({
                transactionId: `test_${idempotencyKey}`,
                entries,
                createdByUid: 'admin-script',
                entryDate: logicalDate
            }, transaction);
        });
        console.log(`[${label}] SUCCESS: Allowed write for ${dateStr} as expected.`);
    } catch (e) {
        if (e.message.includes('PERIOD_CLOSED')) {
            console.log(`[${label}] BLOCKED: Rejected write for ${dateStr} as expected (PERIOD_CLOSED).`);
        } else {
            console.log(`[${label}] FAILED: Unexpected error: ${e.message}`);
        }
    }
}

async function run() {
    console.log("=== PERIOD VALIDATION VERIFICATION ===");

    // 1. Create a CLOSED period for Jan 1 - Jan 31 2020
    const closedPeriodRef = db.collection('v3_financial_periods').doc('TEST-CLOSED-2020');
    await closedPeriodRef.set({
        periodId: 'TEST-CLOSED-2020',
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2020-01-31T23:59:59Z'),
        status: 'CLOSED'
    });

    // 2. Create an OPEN period for current time
    const openPeriodRef = db.collection('v3_financial_periods').doc('TEST-OPEN-CURRENT');
    await openPeriodRef.set({
        periodId: 'TEST-OPEN-CURRENT',
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-02-28T23:59:59Z'),
        status: 'OPEN'
    });

    // Wait index
    await new Promise(r => setTimeout(r, 2000));

    // Test 1: Write in closed period
    await testPeriod('Closed Period Test', '2020-01-15T12:00:00Z', 'closed123', false);

    // Test 2: Write in open period (like phase 2c script)
    await testPeriod('Open Period Test', '2026-02-15T12:00:00Z', 'open123', true);

    // Cleanup
    await closedPeriodRef.delete();
    await openPeriodRef.delete();
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
