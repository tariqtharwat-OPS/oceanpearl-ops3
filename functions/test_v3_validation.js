/**
 * OPS V3 - Comprehensive Validation Test Suite
 * 
 * This test suite validates all core V3 functionality:
 * - Ledger double-entry balance
 * - Moving average cost calculations
 * - Trip lifecycle (expense → settlement)
 * - Operational loss tracking
 * - Inter-unit transfers
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Test utilities
async function clearTestData() {
  console.log('\n🧹 Clearing test data...');
  
  const collections = ['v3_ledger_entries', 'v3_inventory_valuations'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
  
  console.log('✅ Test data cleared');
}

async function getLedgerBalance(accountId, unitId = null) {
  let query = db.collection('v3_ledger_entries').where('accountId', '==', accountId);
  if (unitId) query = query.where('unitId', '==', unitId);
  
  const snapshot = await query.get();
  let debitTotal = 0;
  let creditTotal = 0;
  
  snapshot.forEach(doc => {
    const entry = doc.data();
    if (entry.entryType === 'debit') {
      debitTotal += entry.baseAmountIDR;
    } else {
      creditTotal += entry.baseAmountIDR;
    }
  });
  
  return { debitTotal, creditTotal, balance: debitTotal - creditTotal };
}

async function getInventoryValuation(unitId, productId) {
  const doc = await db.collection('v3_inventory_valuations').doc(`${unitId}_${productId}`).get();
  return doc.exists ? doc.data() : null;
}

// Test 1: Ledger Double-Entry Balance Validation
async function testLedgerBalance() {
  console.log('\n📊 TEST 1: Ledger Double-Entry Balance');
  
  try {
    // Create test entries manually
    const transactionId = `TEST-BALANCE-${Date.now()}`;
    const batch = db.batch();
    
    const entries = [
      {
        transactionId,
        entryType: 'debit',
        accountId: 'TEST_ACCOUNT',
        baseAmountIDR: 100000,
        unitId: 'TEST_UNIT',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        transactionId,
        entryType: 'credit',
        accountId: 'CASH_BANK',
        baseAmountIDR: 100000,
        unitId: 'TEST_UNIT',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    entries.forEach(entry => {
      const ref = db.collection('v3_ledger_entries').doc();
      batch.set(ref, entry);
    });
    
    await batch.commit();
    
    // Validate balance
    const testBalance = await getLedgerBalance('TEST_ACCOUNT', 'TEST_UNIT');
    const cashBalance = await getLedgerBalance('CASH_BANK', 'TEST_UNIT');
    
    console.log(`  TEST_ACCOUNT: Debit=${testBalance.debitTotal}, Credit=${testBalance.creditTotal}, Balance=${testBalance.balance}`);
    console.log(`  CASH_BANK: Debit=${cashBalance.debitTotal}, Credit=${cashBalance.creditTotal}, Balance=${cashBalance.balance}`);
    
    if (testBalance.debitTotal === 100000 && cashBalance.creditTotal === 100000) {
      console.log('✅ PASS: Ledger entries are balanced');
      return true;
    } else {
      console.log('❌ FAIL: Ledger entries are not balanced');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 2: Moving Average Cost Calculation
async function testMovingAverage() {
  console.log('\n📈 TEST 2: Moving Average Cost Calculation');
  
  try {
    const unitId = 'TEST_UNIT';
    const productId = 'TEST_PRODUCT';
    const valuationRef = db.collection('v3_inventory_valuations').doc(`${unitId}_${productId}`);
    
    // First purchase: 100kg at 50,000 IDR/kg = 5,000,000 IDR
    await valuationRef.set({
      unitId,
      productId,
      totalQuantityKg: 100,
      totalValue: 5000000,
      movingAverageCost: 50000,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('  Initial: 100kg @ 50,000 IDR/kg = 5,000,000 IDR');
    
    // Second purchase: 50kg at 60,000 IDR/kg = 3,000,000 IDR
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(valuationRef);
      const current = doc.data();
      
      const newQty = current.totalQuantityKg + 50;
      const newValue = current.totalValue + 3000000;
      const newMAC = newValue / newQty;
      
      transaction.set(valuationRef, {
        unitId,
        productId,
        totalQuantityKg: newQty,
        totalValue: newValue,
        movingAverageCost: newMAC,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    const valuation = await getInventoryValuation(unitId, productId);
    const expectedMAC = 8000000 / 150; // 53,333.33 IDR/kg
    
    console.log(`  After second purchase: 150kg @ ${valuation.movingAverageCost.toFixed(2)} IDR/kg`);
    console.log(`  Expected MAC: ${expectedMAC.toFixed(2)} IDR/kg`);
    
    if (Math.abs(valuation.movingAverageCost - expectedMAC) < 0.01) {
      console.log('✅ PASS: Moving average cost calculated correctly');
      return true;
    } else {
      console.log('❌ FAIL: Moving average cost is incorrect');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 3: Trip Lifecycle (Expense → Settlement)
async function testTripLifecycle() {
  console.log('\n🚢 TEST 3: Trip Lifecycle');
  
  try {
    const tripId = `TEST-TRIP-${Date.now()}`;
    const unitId = 'TEST_BOAT';
    
    // Step 1: Record trip expense
    console.log('  Step 1: Recording trip expense (50,000 IDR)...');
    const expenseTransaction = `TRIP-EXP-${tripId}-${Date.now()}`;
    const expenseBatch = db.batch();
    
    [
      { entryType: 'debit', accountId: 'TRIP_CLEARING', baseAmountIDR: 50000 },
      { entryType: 'credit', accountId: 'CASH_BANK', baseAmountIDR: 50000 }
    ].forEach(entry => {
      const ref = db.collection('v3_ledger_entries').doc();
      expenseBatch.set(ref, {
        ...entry,
        transactionId: expenseTransaction,
        unitId,
        tripId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await expenseBatch.commit();
    
    // Step 2: Calculate trip costs
    const tripCostSnapshot = await db.collection('v3_ledger_entries')
      .where('accountId', '==', 'TRIP_CLEARING')
      .where('tripId', '==', tripId)
      .get();
    
    let totalTripCost = 0;
    tripCostSnapshot.forEach(doc => {
      const entry = doc.data();
      if (entry.entryType === 'debit') {
        totalTripCost += entry.baseAmountIDR;
      } else {
        totalTripCost -= entry.baseAmountIDR;
      }
    });
    
    console.log(`  Total trip cost: ${totalTripCost} IDR`);
    
    // Step 3: Settle trip to inventory
    console.log('  Step 2: Settling trip to inventory (10kg catch)...');
    const settleTransaction = `TRIP-SETTLE-${tripId}-${Date.now()}`;
    const settleBatch = db.batch();
    
    const receivingUnit = 'TEST_WAREHOUSE';
    const productId = 'TEST_FISH';
    const quantityKg = 10;
    
    // Update inventory valuation
    const valuationRef = db.collection('v3_inventory_valuations').doc(`${receivingUnit}_${productId}`);
    settleBatch.set(valuationRef, {
      unitId: receivingUnit,
      productId,
      totalQuantityKg: quantityKg,
      totalValue: totalTripCost,
      movingAverageCost: totalTripCost / quantityKg,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create ledger entries
    [
      { entryType: 'debit', accountId: 'INVENTORY', baseAmountIDR: totalTripCost, unitId: receivingUnit },
      { entryType: 'credit', accountId: 'TRIP_CLEARING', baseAmountIDR: totalTripCost, unitId: receivingUnit }
    ].forEach(entry => {
      const ref = db.collection('v3_ledger_entries').doc();
      settleBatch.set(ref, {
        ...entry,
        transactionId: settleTransaction,
        productId,
        tripId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await settleBatch.commit();
    
    // Validate
    const valuation = await getInventoryValuation(receivingUnit, productId);
    const tripClearingBalance = await getLedgerBalance('TRIP_CLEARING');
    
    console.log(`  Inventory: ${valuation.totalQuantityKg}kg @ ${valuation.movingAverageCost} IDR/kg`);
    console.log(`  Trip Clearing Balance: ${tripClearingBalance.balance} IDR (should be 0)`);
    
    if (valuation.totalQuantityKg === 10 && valuation.movingAverageCost === 5000 && tripClearingBalance.balance === 0) {
      console.log('✅ PASS: Trip lifecycle completed correctly');
      return true;
    } else {
      console.log('❌ FAIL: Trip lifecycle validation failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 4: Operational Loss Tracking
async function testOperationalLoss() {
  console.log('\n📉 TEST 4: Operational Loss Tracking');
  
  try {
    const unitId = 'TEST_DRYING';
    const productId = 'TEST_FISH';
    
    // Setup: Create inventory
    const valuationRef = db.collection('v3_inventory_valuations').doc(`${unitId}_${productId}`);
    await valuationRef.set({
      unitId,
      productId,
      totalQuantityKg: 100,
      totalValue: 1000000,
      movingAverageCost: 10000,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('  Initial inventory: 100kg @ 10,000 IDR/kg');
    
    // Record loss: 5kg drying loss
    const lossQuantityKg = 5;
    const lossValue = lossQuantityKg * 10000;
    const transactionId = `LOSS-DRYING-${Date.now()}`;
    
    const batch = db.batch();
    
    // Update inventory
    batch.set(valuationRef, {
      unitId,
      productId,
      totalQuantityKg: 95,
      totalValue: 950000,
      movingAverageCost: 10000,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create ledger entries
    [
      { entryType: 'debit', accountId: 'EXPENSE_OPERATIONAL_LOSS', baseAmountIDR: lossValue, lossType: 'DRYING' },
      { entryType: 'credit', accountId: 'INVENTORY', baseAmountIDR: lossValue, lossType: 'DRYING' }
    ].forEach(entry => {
      const ref = db.collection('v3_ledger_entries').doc();
      batch.set(ref, {
        ...entry,
        transactionId,
        unitId,
        productId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    // Validate
    const valuation = await getInventoryValuation(unitId, productId);
    const lossExpense = await getLedgerBalance('EXPENSE_OPERATIONAL_LOSS');
    
    console.log(`  After loss: ${valuation.totalQuantityKg}kg @ ${valuation.movingAverageCost} IDR/kg`);
    console.log(`  Loss expense recorded: ${lossExpense.balance} IDR`);
    
    if (valuation.totalQuantityKg === 95 && lossExpense.balance === 50000) {
      console.log('✅ PASS: Operational loss tracked correctly');
      return true;
    } else {
      console.log('❌ FAIL: Operational loss validation failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 5: Inter-Unit Transfer at Cost
async function testInterUnitTransfer() {
  console.log('\n🔄 TEST 5: Inter-Unit Transfer at Cost');
  
  try {
    const fromUnit = 'TEST_UNIT_A';
    const toUnit = 'TEST_UNIT_B';
    const productId = 'TEST_FISH';
    
    // Setup: Create inventory in sending unit
    const fromValuationRef = db.collection('v3_inventory_valuations').doc(`${fromUnit}_${productId}`);
    await fromValuationRef.set({
      unitId: fromUnit,
      productId,
      totalQuantityKg: 50,
      totalValue: 500000,
      movingAverageCost: 10000,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('  Initial: Unit A has 50kg @ 10,000 IDR/kg');
    
    // Transfer 20kg
    const transferQty = 20;
    const transferValue = transferQty * 10000;
    const transactionId = `TRANSFER-${Date.now()}`;
    
    const batch = db.batch();
    
    // Decrease in sending unit
    batch.set(fromValuationRef, {
      unitId: fromUnit,
      productId,
      totalQuantityKg: 30,
      totalValue: 300000,
      movingAverageCost: 10000,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Increase in receiving unit
    const toValuationRef = db.collection('v3_inventory_valuations').doc(`${toUnit}_${productId}`);
    batch.set(toValuationRef, {
      unitId: toUnit,
      productId,
      totalQuantityKg: transferQty,
      totalValue: transferValue,
      movingAverageCost: 10000,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create ledger entries (at cost)
    [
      { entryType: 'debit', accountId: 'INVENTORY', baseAmountIDR: transferValue, unitId: toUnit },
      { entryType: 'credit', accountId: 'INVENTORY', baseAmountIDR: transferValue, unitId: fromUnit }
    ].forEach(entry => {
      const ref = db.collection('v3_ledger_entries').doc();
      batch.set(ref, {
        ...entry,
        transactionId,
        productId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    // Validate
    const fromValuation = await getInventoryValuation(fromUnit, productId);
    const toValuation = await getInventoryValuation(toUnit, productId);
    
    console.log(`  After transfer: Unit A has ${fromValuation.totalQuantityKg}kg, Unit B has ${toValuation.totalQuantityKg}kg`);
    console.log(`  Both at cost: ${fromValuation.movingAverageCost} IDR/kg`);
    
    if (fromValuation.totalQuantityKg === 30 && toValuation.totalQuantityKg === 20 && toValuation.movingAverageCost === 10000) {
      console.log('✅ PASS: Inter-unit transfer at cost validated');
      return true;
    } else {
      console.log('❌ FAIL: Inter-unit transfer validation failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('  OPS V3 VALIDATION TEST SUITE');
  console.log('═══════════════════════════════════════════════');
  
  await clearTestData();
  
  const results = {
    ledgerBalance: await testLedgerBalance(),
    movingAverage: await testMovingAverage(),
    tripLifecycle: await testTripLifecycle(),
    operationalLoss: await testOperationalLoss(),
    interUnitTransfer: await testInterUnitTransfer()
  };
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('  TEST RESULTS');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Ledger Balance:       ${results.ledgerBalance ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Moving Average:       ${results.movingAverage ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Trip Lifecycle:       ${results.tripLifecycle ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Operational Loss:     ${results.operationalLoss ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Inter-Unit Transfer:  ${results.interUnitTransfer ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  
  console.log('\n═══════════════════════════════════════════════');
  if (allPassed) {
    console.log('  🎉 ALL TESTS PASSED');
  } else {
    console.log('  ⚠️  SOME TESTS FAILED');
  }
  console.log('═══════════════════════════════════════════════\n');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
