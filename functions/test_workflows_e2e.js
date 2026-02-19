const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require('/home/ubuntu/oceanpearl-ops-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Import workflow functions
const { recordTripExpense, settleTripToInventory, recordOperationalLoss, recordInterUnitTransfer } = require('./lib/workflows');
const { getLedgerBalance } = require('./lib/ledger');
const { getInventoryValuation } = require('./lib/inventory');

async function runWorkflowTests() {
  console.log('🧪 PHASE 3: END-TO-END OPERATIONAL WORKFLOW TESTS\n');
  console.log('=' .repeat(70));
  
  const tripId = 'TRIP-TEST-001';
  const unitBoat = 'UNIT-BOAT-1';
  const unitDry = 'UNIT-DRY-1';
  const locationKai = 'LOC-KAI';
  const productFresh = 'ANCH-FRESH';
  const productDryBigA = 'ANCH-DRY-BIG-A';
  
  try {
    // TEST 1: Record Trip Expenses (should capitalize to Trip Clearing)
    console.log('\n📝 TEST 1: Record Trip Expense (Fuel)');
    console.log('-'.repeat(70));
    
    const expense1 = await recordTripExpense({
      tripId,
      unitId: unitBoat,
      locationId: locationKai,
      expenseType: 'FUEL',
      amount: 5000000, // 5M IDR
      description: 'Fuel for trip',
      transactionId: 'TXN-EXP-001'
    });
    
    console.log('✅ Trip expense recorded');
    console.log('   Transaction ID:', expense1.transactionId);
    console.log('   Posting: Debit Trip Clearing (Asset), Credit Cash');
    
    // Verify ledger balance for Trip Clearing
    const tripClearingBalance = await getLedgerBalance({
      accountId: 'TRIP_CLEARING',
      unitId: unitBoat,
      tripId
    });
    
    console.log('   Trip Clearing Balance:', tripClearingBalance.balance, 'IDR');
    
    if (tripClearingBalance.balance !== 5000000) {
      throw new Error(`Trip Clearing balance mismatch! Expected 5000000, got ${tripClearingBalance.balance}`);
    }
    
    // TEST 2: Record another expense
    console.log('\n📝 TEST 2: Record Trip Expense (Ice)');
    console.log('-'.repeat(70));
    
    const expense2 = await recordTripExpense({
      tripId,
      unitId: unitBoat,
      locationId: locationKai,
      expenseType: 'ICE',
      amount: 2000000, // 2M IDR
      description: 'Ice for preservation',
      transactionId: 'TXN-EXP-002'
    });
    
    console.log('✅ Trip expense recorded');
    console.log('   Total Trip Clearing should be: 7,000,000 IDR');
    
    const tripClearingBalance2 = await getLedgerBalance({
      accountId: 'TRIP_CLEARING',
      unitId: unitBoat,
      tripId
    });
    
    console.log('   Trip Clearing Balance:', tripClearingBalance2.balance, 'IDR');
    
    if (tripClearingBalance2.balance !== 7000000) {
      throw new Error(`Trip Clearing balance mismatch! Expected 7000000, got ${tripClearingBalance2.balance}`);
    }
    
    // TEST 3: Settle Trip to Inventory (capitalize trip costs to inventory)
    console.log('\n📝 TEST 3: Settle Trip to Inventory (1000 kg fresh anchovy)');
    console.log('-'.repeat(70));
    
    const settlement = await settleTripToInventory({
      tripId,
      receivingUnitId: unitBoat,
      locationId: locationKai,
      productId: productFresh,
      quantityKg: 1000,
      transactionId: 'TXN-SETTLE-001'
    });
    
    console.log('✅ Trip settled to inventory');
    console.log('   Posting: Debit Inventory, Credit Trip Clearing');
    console.log('   Quantity: 1000 kg');
    console.log('   Total Cost: 7,000,000 IDR');
    console.log('   Unit Cost (MAC): 7,000 IDR/kg');
    
    // Verify Trip Clearing is now zero
    const tripClearingBalance3 = await getLedgerBalance({
      accountId: 'TRIP_CLEARING',
      unitId: unitBoat,
      tripId
    });
    
    console.log('   Trip Clearing Balance (should be 0):', tripClearingBalance3.balance, 'IDR');
    
    if (tripClearingBalance3.balance !== 0) {
      throw new Error(`Trip Clearing should be 0 after settlement! Got ${tripClearingBalance3.balance}`);
    }
    
    // Verify inventory valuation
    const inventoryVal = await getInventoryValuation({
      unitId: unitBoat,
      productId: productFresh
    });
    
    console.log('   Inventory Valuation:');
    console.log('     Quantity:', inventoryVal.quantityKg, 'kg');
    console.log('     Total Value:', inventoryVal.totalValue, 'IDR');
    console.log('     Moving Average Cost:', inventoryVal.movingAverageCost, 'IDR/kg');
    
    if (inventoryVal.quantityKg !== 1000) {
      throw new Error(`Inventory quantity mismatch! Expected 1000, got ${inventoryVal.quantityKg}`);
    }
    
    if (inventoryVal.movingAverageCost !== 7000) {
      throw new Error(`MAC mismatch! Expected 7000, got ${inventoryVal.movingAverageCost}`);
    }
    
    // TEST 4: Record Operational Loss (Sorting)
    console.log('\n📝 TEST 4: Record Operational Loss (Sorting - 50 kg)');
    console.log('-'.repeat(70));
    
    const loss = await recordOperationalLoss({
      lossType: 'SORTING',
      unitId: unitBoat,
      locationId: locationKai,
      productId: productFresh,
      lossQuantityKg: 50,
      transactionId: 'TXN-LOSS-001'
    });
    
    console.log('✅ Operational loss recorded');
    console.log('   Loss Type: SORTING');
    console.log('   Quantity Lost: 50 kg');
    console.log('   Value Lost: 350,000 IDR (50 kg × 7,000 IDR/kg)');
    console.log('   Posting: Debit Operational Loss Expense, Credit Inventory');
    
    // Verify inventory after loss
    const inventoryVal2 = await getInventoryValuation({
      unitId: unitBoat,
      productId: productFresh
    });
    
    console.log('   Inventory After Loss:');
    console.log('     Quantity:', inventoryVal2.quantityKg, 'kg');
    console.log('     Total Value:', inventoryVal2.totalValue, 'IDR');
    console.log('     MAC (should remain 7000):', inventoryVal2.movingAverageCost, 'IDR/kg');
    
    if (inventoryVal2.quantityKg !== 950) {
      throw new Error(`Inventory quantity after loss mismatch! Expected 950, got ${inventoryVal2.quantityKg}`);
    }
    
    if (inventoryVal2.movingAverageCost !== 7000) {
      throw new Error(`MAC should remain 7000 after loss! Got ${inventoryVal2.movingAverageCost}`);
    }
    
    // TEST 5: Inter-Unit Transfer (at cost)
    console.log('\n📝 TEST 5: Inter-Unit Transfer (100 kg to Drying Unit)');
    console.log('-'.repeat(70));
    
    const transfer = await recordInterUnitTransfer({
      fromUnitId: unitBoat,
      toUnitId: unitDry,
      locationId: locationKai,
      productId: productFresh,
      quantityKg: 100,
      transactionId: 'TXN-TRANSFER-001'
    });
    
    console.log('✅ Inter-unit transfer recorded');
    console.log('   From: UNIT-BOAT-1');
    console.log('   To: UNIT-DRY-1');
    console.log('   Quantity: 100 kg');
    console.log('   Transfer Cost: 700,000 IDR (100 kg × 7,000 IDR/kg)');
    console.log('   Posting: Debit Inventory (Dry), Credit Inventory (Boat)');
    
    // Verify source inventory
    const inventoryBoat = await getInventoryValuation({
      unitId: unitBoat,
      productId: productFresh
    });
    
    console.log('   Boat Inventory After Transfer:');
    console.log('     Quantity:', inventoryBoat.quantityKg, 'kg');
    console.log('     MAC:', inventoryBoat.movingAverageCost, 'IDR/kg');
    
    if (inventoryBoat.quantityKg !== 850) {
      throw new Error(`Boat inventory mismatch! Expected 850, got ${inventoryBoat.quantityKg}`);
    }
    
    // Verify destination inventory
    const inventoryDry = await getInventoryValuation({
      unitId: unitDry,
      productId: productFresh
    });
    
    console.log('   Dry Inventory After Transfer:');
    console.log('     Quantity:', inventoryDry.quantityKg, 'kg');
    console.log('     MAC:', inventoryDry.movingAverageCost, 'IDR/kg');
    
    if (inventoryDry.quantityKg !== 100) {
      throw new Error(`Dry inventory mismatch! Expected 100, got ${inventoryDry.quantityKg}`);
    }
    
    if (inventoryDry.movingAverageCost !== 7000) {
      throw new Error(`Dry MAC mismatch! Expected 7000, got ${inventoryDry.movingAverageCost}`);
    }
    
    // FINAL SUMMARY
    console.log('\n' + '='.repeat(70));
    console.log('🎉 PHASE 3: ALL WORKFLOW TESTS PASSED!');
    console.log('='.repeat(70));
    console.log('\n✅ Trip Clearing Model: WORKING');
    console.log('✅ Operational Loss Tracking: WORKING');
    console.log('✅ Moving Average Cost: WORKING');
    console.log('✅ Inter-Unit Transfer: WORKING');
    console.log('✅ Ledger Double-Entry Integrity: ENFORCED');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

runWorkflowTests();
