# OPS3 Phase 1 MVP Implementation Plan

## Scope
**Target:** Dedicated exclusively to the **Boat Operator** role.
**Goal:** Prove the foundational event-driven architecture directly against the `OPS3_BLUEPRINT.html` field workflow mechanics. Establish zero-fallback routing, offline document writing, and mathematically derived wallet balances.

---

## Targeted Implementation Mechanics
Phase 1 limits operational boundaries to establishing a Trip, expending funds, generating localized receiving documentation (SKUs), executing localized divestment (Sales), recording Crew advances, and finally closing the immutable Trip bounds.

### 1. Implemented UI Screens (From Blueprint)
1. **1. Start Trip** (`boat_start`)
2. **2. Trip Start Balances** (`boat_init`)
3. **3. Trip Expense Invoice** (`boat_exp`)
4. **4. Receiv: Own Catch** (`boat_recv_own`)
5. **5. Receiv: Buy Fishermen** (`boat_recv_buy`)
6. **6. Boat Sale Invoice** (`boat_sale`)
7. **7. Trip Wallet & Transfers** (`boat_wallet`)
8. **8. Close Trip** (`boat_close`)

---

## Firestore Document Mechanics (Event Writes)

In Phase 1, the client will only append discrete event documents to Firestore.

- **On Trip Start:**
  - Create `trips/{tripId}` record setting the `status = 'active'`, associating the `Boat` unit hierarchy and `User` initiating.
- **On Trip Opening Balances:**
  - Record the opening baseline of physical components (ice, fuel, initial cash transfer from parent Hub).
  - Writing Crew Advances generates distinct `employee_balance_transactions` bound mapped to individual worker IDs defined identically in the Session Staff Roster.
- **On Expense Vouchers:**
  - Inject negative value records into `wallet_transactions` structurally bounding the query context strictly to the current Trip's targeted Wallet (e.g., `TRIP_WALLET_B1`).
  - Capture the explicit Vendor string, mapped tag (`Fuel`, `Port Fee`), and optional linking to Crew names if categorized as Kasbon/Advance.
- **On Receivings (Own or External):**
  - Form an explicit `documents` receiving DO log.
  - Generates positive scalar KG variables directly into the localized `inventory_movements` table tagged explicitly to the Boat Unit. (Creates unassigned stock).
- **On Sales (Divestment):**
  - Appends `documents` defining the sale instance (Sale to Vendor).
  - Triggers negative `inventory_movements` depleting local Boat Unit stock.
  - Fires positive `wallet_transactions` logging local trip cash accumulation, OR flags AR against Hub Finance if the transaction was strictly paper credit.
- **On Trip Close:**
  - Lock all records from the Trip boundaries (Sets `status='closed'`).
  - Calculate Final Crew settlements based on aggregate mapped `employee_balance_transactions` generated across the lifecycle.
  - Final remittance `wallet_transactions` pushing remaining trip cash mathematically back to the Parent Unit (Location Hub).

---

## Validation & Business Rules

1. **Strict Offline Data Writes:**
   The frontend app must explicitly persist all the aforementioned vectors to Firestore IndexedDB offline. All data displays locally immediately.
   
2. **Derived Wallet Checking:**
   The UI calculates Wallet Balance exclusively via `SUM(wallet_transactions)`. To add an expense, it mathematically verifies against the aggregate sum to ensure operations do not plunge into negative values offline.

3. **Status Mutability Limit:**
   Active trips cannot be overridden. Closing a Trip is destructive to the active state block; nothing can be written to the `tripId` once flagged closed.

---

## Cloud Functions (Backend Hooks)

- **`onTripCreated`:** Broadcasts notifications to Location Manager, initiates localized data caching for Crew ID references.
- **`onDocumentPosted`:** Fires globally off ANY document creation. Sweeps transactions. If an overarching `wallet_transaction` generated off this document drops sum totals theoretically below zero based on simultaneous race conditions, the system marks the document flag `anomaly_overdraw = true` and alerts Shark AI while strictly maintaining the immutable accounting line.
- **`onTripClosed`:** Tallies total yield statistics mechanically for automated CEO-level reporting grids and permanently isolates the trip segment. Generates immutable closure summary objects.
