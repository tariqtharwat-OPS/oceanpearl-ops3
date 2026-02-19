# Ocean Pearl OPS V3 - Deployment Guide

## Pre-Deployment Checklist

Before deploying OPS V3 to production, ensure the following conditions are met:

### 1. Code Readiness
- All V2 Cloud Functions have been removed
- V3 functions are implemented and tested
- Frontend builds without errors
- All TypeScript compilation passes
- Git branch `ops3-controlled-rebuild` is up to date

### 2. Firebase Project Configuration
- **Project ID:** `oceanpearl-ops`
- **Region:** `asia-southeast1`
- **Auth Domain:** `oceanpearl-ops.firebaseapp.com`
- **Hosting URL:** `https://oceanpearl-ops.web.app`

### 3. Database Preparation
- **CRITICAL:** Perform full database reset before deployment
- All V2 collections will be inactive (no writes)
- All V3 collections use `v3_` prefix

---

## Deployment Steps

### Step 1: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Set Firebase Project

```bash
cd /home/ubuntu/oceanpearl-ops-v2
firebase use oceanpearl-ops
```

### Step 4: Install Dependencies

```bash
# Install function dependencies
cd functions
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### Step 5: Build Frontend

```bash
cd /home/ubuntu/oceanpearl-ops-v2/frontend
pnpm build
```

**Expected Output:**
```
✓ built in X.XXs
dist/index.html
dist/assets/...
```

### Step 6: Deploy Functions Only (First)

**CRITICAL:** Deploy functions first to ensure backend is ready before frontend.

```bash
cd /home/ubuntu/oceanpearl-ops-v2
firebase deploy --only functions
```

**Expected Output:**
```
✔  Deploy complete!

Functions:
  ledger-createLedgerEntries(asia-southeast1)
  ledger-getLedgerBalance(asia-southeast1)
  inventory-getInventoryValuation(asia-southeast1)
  inventory-getUnitInventory(asia-southeast1)
  workflows-recordTripExpense(asia-southeast1)
  workflows-settleTripToInventory(asia-southeast1)
  workflows-recordOperationalLoss(asia-southeast1)
  workflows-recordInterUnitTransfer(asia-southeast1)
  shark-processLedgerEvent(asia-southeast1)
  shark-getSharkAlerts(asia-southeast1)
```

### Step 7: Verify Function Deployment

Check that all functions are deployed and accessible:

```bash
firebase functions:list
```

### Step 8: Deploy Frontend (Hosting)

```bash
cd /home/ubuntu/oceanpearl-ops-v2
firebase deploy --only hosting
```

**Expected Output:**
```
✔  Deploy complete!

Hosting URL: https://oceanpearl-ops.web.app
```

### Step 9: Verify Deployment

1. Open browser to: `https://oceanpearl-ops.web.app`
2. Verify login page loads
3. Log in with existing credentials
4. Verify Operations and Finance pages load without errors

---

## Post-Deployment Validation

After deployment, perform the following validation steps:

### 1. Smoke Test
- [ ] Application loads without errors
- [ ] Login works
- [ ] Operations page accessible
- [ ] Finance page accessible
- [ ] No console errors in browser developer tools

### 2. Function Connectivity Test
- [ ] Navigate to Operations page
- [ ] Fill in a test Trip Expense form
- [ ] Submit and verify success message
- [ ] Check browser Network tab for successful function call

### 3. Bilingual Test
- [ ] Click "ID" language button
- [ ] Verify UI changes to Indonesian
- [ ] Click "EN" language button
- [ ] Verify UI changes to English

### 4. Manual Validation Checklist
- [ ] Complete all tests in `OPS_V3_VALIDATION_CHECKLIST.md`
- [ ] Verify all acceptance criteria are met
- [ ] Sign off on validation checklist

---

## Rollback Procedure (If Needed)

If critical issues are discovered post-deployment:

### Option 1: Rollback to Previous Deployment

```bash
# List previous deployments
firebase hosting:releases:list

# Rollback to specific release
firebase hosting:rollback
```

### Option 2: Redeploy V2 Branch

```bash
git checkout ops2-rebuild-main
firebase deploy
```

---

## Monitoring and Logging

### View Cloud Function Logs

```bash
firebase functions:log
```

### View Specific Function Logs

```bash
firebase functions:log --only workflows-recordTripExpense
```

### Monitor in Firebase Console

1. Go to: https://console.firebase.google.com/project/oceanpearl-ops
2. Navigate to Functions → Logs
3. Monitor for errors or warnings

---

## Known Limitations (Phase 1)

The current V3 implementation includes:
- ✅ Core ledger with double-entry enforcement
- ✅ Moving average inventory valuation
- ✅ Trip Clearing model
- ✅ Operational loss tracking
- ✅ Inter-unit transfers
- ✅ Bilingual UI (Indonesian/English)

Not yet implemented (future phases):
- ⏳ Partner balance management UI
- ⏳ Crew profit-share settlement UI
- ⏳ Sale and COGS workflows
- ⏳ Shark AI intelligence and alerts
- ⏳ WhatsApp integration
- ⏳ Advanced reporting
- ⏳ Admin panel for master data

---

## Support and Troubleshooting

### Common Issues

**Issue:** Functions fail to deploy
**Solution:** Check that all dependencies are installed and `package.json` is correct

**Issue:** Frontend shows "Function not found" error
**Solution:** Verify functions are deployed and region is set to `asia-southeast1`

**Issue:** Bilingual switching doesn't work
**Solution:** Clear browser cache and reload

**Issue:** Ledger entries show "not balanced" error
**Solution:** Check that all transaction entries have matching debit/credit totals

---

## Deployment Checklist

Before marking deployment as complete:

- [ ] All functions deployed successfully
- [ ] Frontend deployed successfully
- [ ] Login works
- [ ] Operations page functional
- [ ] Finance page functional
- [ ] Bilingual switching works
- [ ] No console errors
- [ ] Manual validation checklist completed
- [ ] All acceptance criteria met
- [ ] Progress log updated
- [ ] Deployment documented

**Deployment Date:** _________________

**Deployed By:** _________________

**Status:** ☐ SUCCESS  ☐ ROLLBACK REQUIRED

**Notes:**
