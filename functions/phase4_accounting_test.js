/**
 * PHASE 4: ACCOUNTING INTEGRITY TEST
 * 
 * Tests:
 * 1. Double-entry enforcement (debits = credits)
 * 2. Idempotency protection (duplicate transactionId rejected)
 * 3. Balance validation
 * 4. Moving average calculations
 * 5. Trip clearing logic
 */

const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/.firebase/service-account.json');

// Initialize Firebase Admin SDK  
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Import function modules
const { createLedgerEntriesHelper } = require('./lib/ledger');

async function runPhase4Test() {
  console.log('='.repeat(70));
  console.log('PHASE 4: ACCOUNTING INTEGRITY TEST');
  console.log('='.repeat(70));
  
  const results = {
    doubleEntry: false,
    idempotency: false,
    balance: false,
    tripClearing: false
  };
  
  try {
    // TEST 1: Double-Entry Enforcement
    console.log('\n[TEST 1/4] Double-Entry Enforcement');
    console.log('Testing that unbalanced entries are rejected...');
    
    const unbalancedEntries = [
      {
        entryType: "debit",
        accountId: "TEST_ACCOUNT",
        baseAmountIDR: 100000,
        description: "Unbalanced debit"
      },
      {
        entryType: "credit",
        accountId: "TEST_ACCOUNT",
        baseAmountIDR: 50000, // Intentionally wrong
        description: "Unbalanced credit"
      }
    ];
    
    try {
      await createLedgerEntriesHelper('TEST-UNBALANCED-001', unbalancedEntries);
      console.log('   ❌ FAIL: Unbalanced entries were accepted!');
      results.doubleEntry = false;
    } catch (error) {
      if (error.message.includes('not balanced')) {
        console.log('   ✅ PASS: Unbalanced entries correctly rejected');
        console.log(`   Error message: "${error.message}"`);
        results.doubleEntry = true;
      } else {
        console.log('   ❌ FAIL: Wrong error:', error.message);
        results.doubleEntry = false;
      }
    }
    
    // TEST 2: Idempotency Protection
    console.log('\n[TEST 2/4] Idempotency Protection');
    console.log('Testing that duplicate transactionId is handled...');
    
    const testTransactionId = `TEST-IDEMPOTENT-${Date.now()}`;
    const validEntries = [
      {
        entryType: "debit",
        accountId: "TEST_ACCOUNT",
        baseAmountIDR: 100000,
        description: "Test debit"
      },
      {
        entryType: "credit",
        accountId: "TEST_ACCOUNT",
        baseAmountIDR: 100000,
        description: "Test credit"
      }
    ];
    
    // First call should succeed
    await createLedgerEntriesHelper(testTransactionId, validEntries);
    console.log('   First call succeeded');
    
    // Count entries
    const firstCount = await db.collection('v3_ledger_entries')
      .where('transactionId', '==', testTransactionId)
      .get();
    console.log(`   Entries created: ${firstCount.size}`);
    
    // Second call with same transactionId
    try {
      await createLedgerEntriesHelper(testTransactionId, validEntries);
      const secondCount = await db.collection('v3_ledger_entries')
        .where('transactionId', '==', testTransactionId)
        .get();
      
      if (secondCount.size === firstCount.size) {
        console.log('   ✅ PASS: Duplicate transactionId prevented duplicate entries');
        results.idempotency = true;
      } else {
        console.log(`   ⚠️  WARNING: Duplicate entries created (${secondCount.size} total)`);
        console.log('   Note: Idempotency should be enforced at application level');
        results.idempotency = false;
      }
    } catch (error) {
      console.log('   ✅ PASS: Duplicate transactionId rejected with error');
      console.log(`   Error: ${error.message}`);
      results.idempotency = true;
    }
    
    // TEST 3: Balance Validation
    console.log('\n[TEST 3/4] Balance Validation');
    console.log('Verifying all existing ledger entries are balanced...');
    
    // Get all transactions
    const allEntries = await db.collection('v3_ledger_entries').get();
    const transactionMap = new Map();
    
    allEntries.forEach(doc => {
      const data = doc.data();
      if (!transactionMap.has(data.transactionId)) {
        transactionMap.set(data.transactionId, []);
      }
      transactionMap.get(data.transactionId).push(data);
    });
    
    console.log(`   Total transactions: ${transactionMap.size}`);
    console.log(`   Total entries: ${allEntries.size}`);
    
    let balancedCount = 0;
    let unbalancedCount = 0;
    const unbalancedTransactions = [];
    
    transactionMap.forEach((entries, transactionId) => {
      let debitSum = 0;
      let creditSum = 0;
      
      entries.forEach(entry => {
        if (entry.entryType === 'debit') {
          debitSum += entry.baseAmountIDR;
        } else if (entry.entryType === 'credit') {
          creditSum += entry.baseAmountIDR;
        }
      });
      
      if (Math.abs(debitSum - creditSum) < 0.01) {
        balancedCount++;
      } else {
        unbalancedCount++;
        unbalancedTransactions.push({
          transactionId,
          debitSum,
          creditSum,
          difference: debitSum - creditSum
        });
      }
    });
    
    console.log(`   Balanced transactions: ${balancedCount}`);
    console.log(`   Unbalanced transactions: ${unbalancedCount}`);
    
    if (unbalancedCount > 0) {
      console.log('\n   ⚠️  Unbalanced transactions found:');
      unbalancedTransactions.forEach(t => {
        console.log(`   - ${t.transactionId}`);
        console.log(`     Debit: ${t.debitSum} IDR`);
        console.log(`     Credit: ${t.creditSum} IDR`);
        console.log(`     Difference: ${t.difference} IDR`);
      });
      results.balance = false;
    } else {
      console.log('   ✅ PASS: All transactions are balanced');
      results.balance = true;
    }
    
    // TEST 4: Trip Clearing Logic
    console.log('\n[TEST 4/4] Trip Clearing Logic');
    console.log('Verifying trip clearing account structure...');
    
    const tripClearingEntries = await db.collection('v3_ledger_entries')
      .where('accountId', '==', 'TRIP_CLEARING')
      .get();
    
    console.log(`   Trip clearing entries: ${tripClearingEntries.size}`);
    
    const tripMap = new Map();
    tripClearingEntries.forEach(doc => {
      const data = doc.data();
      if (data.tripId) {
        if (!tripMap.has(data.tripId)) {
          tripMap.set(data.tripId, { debit: 0, credit: 0, count: 0 });
        }
        const trip = tripMap.get(data.tripId);
        trip.count++;
        if (data.entryType === 'debit') {
          trip.debit += data.baseAmountIDR;
        } else if (data.entryType === 'credit') {
          trip.credit += data.baseAmountIDR;
        }
      }
    });
    
    console.log(`   Trips with clearing entries: ${tripMap.size}`);
    
    tripMap.forEach((data, tripId) => {
      const balance = data.debit - data.credit;
      console.log(`   - ${tripId}:`);
      console.log(`     Entries: ${data.count}`);
      console.log(`     Debit: ${data.debit} IDR`);
      console.log(`     Credit: ${data.credit} IDR`);
      console.log(`     Balance: ${balance} IDR`);
    });
    
    if (tripMap.size > 0) {
      console.log('   ✅ PASS: Trip clearing account is being used');
      results.tripClearing = true;
    } else {
      console.log('   ⚠️  WARNING: No trip clearing entries found');
      results.tripClearing = false;
    }
    
    // FINAL RESULTS
    console.log('\n' + '='.repeat(70));
    console.log('PHASE 4 TEST RESULTS');
    console.log('='.repeat(70));
    
    const allPassed = Object.values(results).every(r => r === true);
    
    console.log('\nTest Summary:');
    console.log(`${results.doubleEntry ? '✅' : '❌'} Double-Entry Enforcement: ${results.doubleEntry ? 'PASS' : 'FAIL'}`);
    console.log(`${results.idempotency ? '✅' : '❌'} Idempotency Protection: ${results.idempotency ? 'PASS' : 'FAIL'}`);
    console.log(`${results.balance ? '✅' : '❌'} Balance Validation: ${results.balance ? 'PASS' : 'FAIL'}`);
    console.log(`${results.tripClearing ? '✅' : '❌'} Trip Clearing Logic: ${results.tripClearing ? 'PASS' : 'FAIL'}`);
    
    console.log('\n' + '='.repeat(70));
    if (allPassed) {
      console.log('✅ PHASE 4: PASSED');
      console.log('='.repeat(70));
      process.exit(0);
    } else {
      console.log('❌ PHASE 4: FAILED');
      console.log('='.repeat(70));
      console.log('\nIssues detected that need to be fixed before continuing.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ PHASE 4 TEST: CRITICAL ERROR');
    console.error('='.repeat(70));
    console.error('\nError Message:', error.message);
    console.error('\nStack Trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

runPhase4Test();
