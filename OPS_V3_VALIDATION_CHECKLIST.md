# Ocean Pearl OPS V3 - Manual Validation Checklist

## Pre-Deployment Validation

### Backend Integrity Checks
- [ ] All V2 Cloud Functions removed from `functions/index.js`
- [ ] V3 ledger module (`lib/ledger.js`) implements double-entry enforcement
- [ ] V3 inventory module (`lib/inventory.js`) implements moving average cost
- [ ] V3 workflows module (`lib/workflows.js`) implements Trip Clearing model
- [ ] All functions use `asia-southeast1` region
- [ ] No legacy collection references in V3 code

### Schema Validation
- [ ] All V3 collections use `v3_` prefix
- [ ] Ledger entries include dimensional structure (unitId, locationId, productId, speciesId, batchId, partnerId, tripId, lossType)
- [ ] All amounts stored in base currency (IDR)
- [ ] Currency and exchangeRate fields present for multi-currency support

### Frontend Validation
- [ ] Bilingual i18n system implemented (`frontend/src/i18n/index.ts`)
- [ ] Operations page calls V3 functions
- [ ] Finance page calls V3 functions
- [ ] Frontend builds without TypeScript errors

---

## Post-Deployment Validation

### 1. Authentication & Access
- [ ] Can log in with existing Firebase Authentication
- [ ] User session persists across page reloads
- [ ] Can navigate to Operations page
- [ ] Can navigate to Finance page

### 2. Trip Expense Recording
**Test Case:** Record a boat trip expense

**Steps:**
1. Navigate to Operations page
2. Fill in Trip Expense form:
   - Trip ID: `TRIP-001`
   - Unit ID: `BOAT-001`
   - Location ID: `LOC-001`
   - Amount: `50000`
   - Currency: `IDR`
   - Description: `Fuel and supplies`
3. Click Save
4. Verify success message appears

**Expected Result:**
- Success message: "Trip expense recorded successfully" (EN) or "Biaya perjalanan berhasil dicatat" (ID)
- Form clears after submission

**Validation Query (Finance page):**
- Account ID: `TRIP_CLEARING`
- Unit ID: `BOAT-001`
- Expected Balance: 50,000 IDR (debit)

---

### 3. Trip Settlement to Inventory
**Test Case:** Settle a boat trip to inventory

**Steps:**
1. Navigate to Operations page
2. Fill in Trip Settlement form:
   - Trip ID: `TRIP-001` (same as above)
   - Receiving Unit ID: `WAREHOUSE-001`
   - Product ID: `PROD-001`
   - Species ID: `SPECIES-001`
   - Quantity (kg): `10`
3. Click Save
4. Verify success message appears

**Expected Result:**
- Success message: "Trip settled successfully" (EN) or "Perjalanan berhasil diselesaikan" (ID)
- Form clears after submission

**Validation Query (Finance page):**
- Account ID: `TRIP_CLEARING`
- Expected Balance: 0 IDR (fully settled)

**Inventory Validation:**
- Unit ID: `WAREHOUSE-001`
- Product ID: `PROD-001`
- Expected Quantity: 10 kg
- Expected Moving Average Cost: 5,000 IDR/kg (50,000 / 10)

---

### 4. Operational Loss Recording
**Test Case:** Record a drying loss

**Prerequisites:** Must have inventory from previous test

**Steps:**
1. Navigate to Operations page
2. Fill in Loss Recording form:
   - Loss Type: `DRYING`
   - Unit ID: `WAREHOUSE-001`
   - Product ID: `PROD-001`
   - Species ID: `SPECIES-001`
   - Loss Quantity (kg): `2`
3. Click Save
4. Verify success message appears

**Expected Result:**
- Success message: "Loss recorded successfully" (EN) or "Kerugian berhasil dicatat" (ID)
- Form clears after submission

**Validation Query (Finance page):**
- Account ID: `EXPENSE_OPERATIONAL_LOSS`
- Unit ID: `WAREHOUSE-001`
- Expected Balance: 10,000 IDR (2 kg × 5,000 IDR/kg)

**Inventory Validation:**
- Unit ID: `WAREHOUSE-001`
- Product ID: `PROD-001`
- Expected Quantity: 8 kg (10 - 2)
- Expected Moving Average Cost: 5,000 IDR/kg (unchanged)
- Expected Total Value: 40,000 IDR

---

### 5. Ledger Double-Entry Balance Validation
**Test Case:** Verify all transactions are balanced

**Steps:**
1. Navigate to Finance page
2. Query each account involved in previous tests:
   - `TRIP_CLEARING`
   - `CASH_BANK`
   - `INVENTORY`
   - `EXPENSE_OPERATIONAL_LOSS`
3. For each account, verify:
   - Debit Total is displayed
   - Credit Total is displayed
   - Balance is calculated correctly

**Expected Results:**
- `TRIP_CLEARING`: Balance = 0 (debits = credits)
- `CASH_BANK`: Balance = -50,000 (credit from trip expense)
- `INVENTORY`: Balance = 40,000 (debit 50,000 from trip, credit 10,000 from loss)
- `EXPENSE_OPERATIONAL_LOSS`: Balance = 10,000 (debit from loss)

**Critical Validation:**
- Sum of all account balances = 0 (double-entry principle)

---

### 6. Moving Average Cost Validation
**Test Case:** Verify moving average cost updates correctly

**Prerequisites:** Existing inventory from previous tests

**Steps:**
1. Record another trip expense and settlement:
   - Trip ID: `TRIP-002`
   - Unit ID: `BOAT-001`
   - Amount: `60,000 IDR`
   - Settle to: `WAREHOUSE-001`
   - Product ID: `PROD-001`
   - Quantity: `10 kg`

2. Navigate to Finance page
3. Query inventory valuation:
   - Unit ID: `WAREHOUSE-001`
   - Product ID: `PROD-001`

**Expected Result:**
- Total Quantity: 18 kg (8 + 10)
- Total Value: 100,000 IDR (40,000 + 60,000)
- Moving Average Cost: 5,555.56 IDR/kg (100,000 / 18)

---

### 7. Bilingual UI Validation
**Test Case:** Verify language switching works

**Steps:**
1. On any page, click the "ID" button in the language selector
2. Verify all UI labels change to Indonesian
3. Click the "EN" button
4. Verify all UI labels change to English

**Expected Results:**
- Navigation labels change (Dashboard, Operations, Finance, etc.)
- Form labels change
- Button labels change (Save, Cancel, Search, etc.)
- Success/error messages appear in selected language
- Language preference persists across page reloads

---

### 8. Role-Based Security Validation
**Test Case:** Verify function security (manual inspection)

**Steps:**
1. Review Cloud Functions logs for unauthorized access attempts
2. Verify all callable functions check authentication context
3. Verify no sensitive data exposed in error messages

**Expected Results:**
- All functions require authentication
- Unauthenticated calls return proper error codes
- Error messages do not leak sensitive information

---

## Critical Acceptance Criteria

### Backend Integrity
- ✅ All ledger entries are balanced (debits = credits per transaction)
- ✅ Moving average cost calculates correctly
- ✅ Trip Clearing account settles to zero
- ✅ Operational losses reduce inventory correctly
- ✅ All amounts stored in base currency (IDR)

### Data Integrity
- ✅ No V2 collections are written to
- ✅ All V3 collections use proper schema
- ✅ Dimensional data is captured correctly
- ✅ No data loss during operations

### UI/UX
- ✅ Bilingual support works correctly
- ✅ All forms submit successfully
- ✅ Success/error messages display properly
- ✅ No console errors in browser

### Performance
- ✅ Functions respond within 3 seconds
- ✅ UI loads without delay
- ✅ No timeout errors

---

## Sign-Off

**Tested By:** _________________

**Date:** _________________

**Result:** ☐ PASS  ☐ FAIL

**Notes:**
