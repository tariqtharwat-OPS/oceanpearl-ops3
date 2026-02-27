const admin = require('firebase-admin');

// Initialize Firebase Admin (assumes GOOGLE_APPLICATION_CREDENTIALS is set, or running locally with default creds)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'oceanpearl-ops' // Hardcoded to match production
    });
}
const db = admin.firestore();
const { FieldValue } = require('firebase-admin/firestore');
const { createLedgerEntriesInternal } = require('../lib/ledger');

async function runPhase2C() {
    console.log("=== PHASE 2C: Executing Expenses ===");
    const locationId = 'LOC-KAI';
    const unitId = 'UNIT-BOAT-FARIS';
    const tripId = 'TRIP-FARIS_TRIP_2026_02';
    const uid = 'admin-script'; // Admin bypass

    const expenses = [
        { amount: 5000000, memo: 'Vendor 1 - Fuel' },
        { amount: 1000000, memo: 'Vendor 1 - Ice' },
        { amount: 3000000, memo: 'Vendor 2 - Food' },
        { amount: 10000000, memo: 'Vendor 2 - Crew Advance' },
        { amount: 2000000, memo: 'Vendor 3 - Maintenance' },
        { amount: 1000000, memo: 'Vendor 3 - Other' }
    ];

    let totalExpense = 0;

    for (let i = 0; i < expenses.length; i++) {
        const ex = expenses[i];
        const idempotencyKey = `P2C_EXP_${Date.now()}_${i}`;
        const transactionId = `trip_${idempotencyKey}`;
        const amt = ex.amount;
        totalExpense += amt;

        console.log(`Recording Expense ${i + 1}: ${ex.memo} - ${amt} IDR`);

        await db.runTransaction(async (transaction) => {
            const entries = [
                { accountId: "TRIP_EXPENSES", direction: "debit", baseAmountIDR: amt, locationId, unitId, meta: { memo: ex.memo, tripId } },
                { accountId: "CASH", direction: "credit", baseAmountIDR: amt, locationId, unitId, meta: { memo: ex.memo, tripId } },
            ];

            await createLedgerEntriesInternal({ transactionId, entries, createdByUid: uid }, transaction);

            const traceRef = db.collection("v3_trace_events").doc();
            transaction.set(traceRef, {
                type: "TRIP_EXPENSE",
                locationId,
                unitId,
                tripId,
                amountIDR: amt,
                memo: ex.memo,
                transactionId,
                createdAt: FieldValue.serverTimestamp(),
                version: 3
            });
        });
    }

    console.log("\n=== Ledger Verification ===");
    // Get final wallet balance for UNIT-BOAT-FARIS
    const ledgerRef = db.collection('v3_ledger_shards_balance').doc(`${locationId}__${unitId}__CASH`);
    const doc = await ledgerRef.get();
    if (doc.exists) {
        console.log(`Current Wallet Balance [${locationId} / ${unitId}]: IDR ${doc.data().balanceIDR.toLocaleString()}`);
    } else {
        console.log("Wallet Balance not found yet.");
    }

    // Print a voucher
    console.log("\n--- VOUCHER PRINT ---");
    console.log("TRIP EXPENSE VOUCHER");
    console.log("Location / Unit: LOC-KAI / UNIT-BOAT-FARIS");
    console.log("Trip ID:", tripId);
    console.log("Particulars:", expenses[0].memo);
    console.log("Amount: IDR", expenses[0].amount.toLocaleString());
    console.log("Date: 2026-02-01");
    console.log("------------------------");

    console.log("\nPhase 2C Script Complete.");
}

runPhase2C()
    .then(() => process.exit(0))
    .catch((err) => {
        require('fs').writeFileSync('error_url.txt', err.message);
        console.error(err);
        process.exit(1);
    });
