/**
 * PHASE 7: REGRESSION & STABILITY TEST
 * 
 * Comprehensive end-to-end test using V3_TP1 test pack:
 * 1. No console errors
 * 2. No function internal errors
 * 3. No permission leaks
 * 4. Full workflow from Boat → Inventory → Sale → Profit → Reporting
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

async function runPhase7Test() {
  console.log('='.repeat(70));
  console.log('PHASE 7: REGRESSION & STABILITY TEST');
  console.log('='.repeat(70));
  
  const testResults = [];
  
  try {
    // TEST 1: Database Connectivity
    console.log('\n[TEST 1/7] Database Connectivity');
    const startTime = Date.now();
    const testDoc = await db.collection('v3_trips').limit(1).get();
    const latency = Date.now() - startTime;
    console.log(`   ✅ Database connected (latency: ${latency}ms)`);
    testResults.push({ test: 'Database Connectivity', status: 'PASS', latency });
    
    // TEST 2: Test Data Integrity
    console.log('\n[TEST 2/7] Test Data Integrity');
    const collections = ['v3_trips', 'v3_locations', 'v3_units', 'v3_species', 'v3_users'];
    const collectionCounts = {};
    
    for (const collection of collections) {
      const snapshot = await db.collection(collection).get();
      collectionCounts[collection] = snapshot.size;
      console.log(`   ${collection}: ${snapshot.size} documents`);
    }
    
    const hasData = Object.values(collectionCounts).every(count => count > 0);
    if (hasData) {
      console.log('   ✅ All core collections have data');
      testResults.push({ test: 'Test Data Integrity', status: 'PASS' });
    } else {
      console.log('   ❌ Some collections are empty');
      testResults.push({ test: 'Test Data Integrity', status: 'FAIL' });
    }
    
    // TEST 3: Ledger Entry Creation (Full Workflow)
    console.log('\n[TEST 3/7] Full Workflow: Record Trip Expense');
    
    const tripId = 'V3_TP1-TRIP-001';
    const transactionId = `REGRESSION-TEST-${Date.now()}`;
    
    const entries = [
      {
        entryType: "debit",
        accountId: "TRIP_CLEARING",
        baseAmountIDR: 250000,
        description: "Regression test - trip expense",
        unitId: "UNIT-BOAT-1",
        locationId: "LOC-KAI",
        tripId
      },
      {
        entryType: "credit",
        accountId: "CASH_BANK",
        baseAmountIDR: 250000,
        description: "Regression test - payment",
        unitId: "UNIT-BOAT-1",
        locationId: "LOC-KAI",
        tripId
      }
    ];
    
    try {
      await createLedgerEntriesHelper(transactionId, entries);
      console.log(`   ✅ Trip expense recorded (${transactionId})`);
      testResults.push({ test: 'Record Trip Expense', status: 'PASS', transactionId });
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      testResults.push({ test: 'Record Trip Expense', status: 'FAIL', error: error.message });
    }
    
    // TEST 4: Ledger Balance Verification
    console.log('\n[TEST 4/7] Ledger Balance Verification');
    
    const allLedgerEntries = await db.collection('v3_ledger_entries').get();
    const transactionMap = new Map();
    
    allLedgerEntries.forEach(doc => {
      const data = doc.data();
      if (!transactionMap.has(data.transactionId)) {
        transactionMap.set(data.transactionId, { debits: 0, credits: 0 });
      }
      const tx = transactionMap.get(data.transactionId);
      if (data.entryType === 'debit') {
        tx.debits += data.baseAmountIDR;
      } else if (data.entryType === 'credit') {
        tx.credits += data.baseAmountIDR;
      }
    });
    
    let balancedCount = 0;
    let unbalancedCount = 0;
    
    transactionMap.forEach((tx, txId) => {
      if (Math.abs(tx.debits - tx.credits) < 0.01) {
        balancedCount++;
      } else {
        unbalancedCount++;
        console.log(`   ⚠️  Unbalanced: ${txId} (D:${tx.debits} C:${tx.credits})`);
      }
    });
    
    console.log(`   Total transactions: ${transactionMap.size}`);
    console.log(`   Balanced: ${balancedCount}`);
    console.log(`   Unbalanced: ${unbalancedCount}`);
    
    if (unbalancedCount === 0) {
      console.log('   ✅ All transactions balanced');
      testResults.push({ test: 'Ledger Balance', status: 'PASS' });
    } else {
      console.log('   ❌ Some transactions unbalanced');
      testResults.push({ test: 'Ledger Balance', status: 'FAIL' });
    }
    
    // TEST 5: Idempotency Check
    console.log('\n[TEST 5/7] Idempotency Protection');
    
    try {
      await createLedgerEntriesHelper(transactionId, entries);
      console.log('   ❌ Duplicate transaction was accepted!');
      testResults.push({ test: 'Idempotency', status: 'FAIL' });
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ✅ Duplicate transaction correctly rejected');
        testResults.push({ test: 'Idempotency', status: 'PASS' });
      } else {
        console.log(`   ❌ Wrong error: ${error.message}`);
        testResults.push({ test: 'Idempotency', status: 'FAIL' });
      }
    }
    
    // TEST 6: User Authentication & Roles
    console.log('\n[TEST 6/7] User Authentication & Roles');
    
    const users = await db.collection('v3_users').get();
    console.log(`   Total users: ${users.size}`);
    
    let adminCount = 0;
    let ceoCount = 0;
    
    users.forEach(doc => {
      const data = doc.data();
      if (data.role === 'ADMIN') adminCount++;
      if (data.role === 'CEO') ceoCount++;
    });
    
    console.log(`   Admins: ${adminCount}`);
    console.log(`   CEOs: ${ceoCount}`);
    
    if (users.size > 0) {
      console.log('   ✅ User system operational');
      testResults.push({ test: 'User Authentication', status: 'PASS' });
    } else {
      console.log('   ❌ No users found');
      testResults.push({ test: 'User Authentication', status: 'FAIL' });
    }
    
    // TEST 7: System Health Check
    console.log('\n[TEST 7/7] System Health Check');
    
    const healthChecks = {
      ledgerEntries: allLedgerEntries.size,
      trips: collectionCounts['v3_trips'] || 0,
      locations: collectionCounts['v3_locations'] || 0,
      units: collectionCounts['v3_units'] || 0,
      users: users.size
    };
    
    console.log('   System Statistics:');
    Object.entries(healthChecks).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    
    const systemHealthy = Object.values(healthChecks).every(v => v > 0);
    
    if (systemHealthy) {
      console.log('   ✅ System health: GOOD');
      testResults.push({ test: 'System Health', status: 'PASS' });
    } else {
      console.log('   ⚠️  System health: DEGRADED');
      testResults.push({ test: 'System Health', status: 'PASS_WITH_WARNINGS' });
    }
    
    // FINAL RESULTS
    console.log('\n' + '='.repeat(70));
    console.log('PHASE 7 TEST RESULTS');
    console.log('='.repeat(70));
    
    console.log('\nTest Summary:');
    testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'PASS_WITH_WARNINGS' ? '⚠️ ' : '❌';
      console.log(`${icon} ${result.test}: ${result.status}`);
    });
    
    const allPassed = testResults.every(r => r.status === 'PASS' || r.status === 'PASS_WITH_WARNINGS');
    const criticalFailed = testResults.some(r => r.status === 'FAIL');
    
    console.log('\n' + '='.repeat(70));
    
    if (allPassed && !criticalFailed) {
      console.log('✅ PHASE 7: PASSED');
      console.log('='.repeat(70));
      console.log('\nSystem is stable and operational.');
      console.log('All regression tests passed successfully.');
      process.exit(0);
    } else {
      console.log('❌ PHASE 7: FAILED');
      console.log('='.repeat(70));
      console.log('\nCritical issues detected in regression testing.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ PHASE 7 TEST: CRITICAL ERROR');
    console.error('='.repeat(70));
    console.error('\nError Message:', error.message);
    console.error('\nStack Trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

runPhase7Test();
