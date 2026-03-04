# OPS3 ACTIVATION PLAN

## Overview
This document serves as the bridging mechanism translating the `OPS3_BLUEPRINT.html` (UI Freeze v1) into an executable, strict timeline.

## Phase 0: Hygiene & Foundation (Zero State)
- **Goal:** Lock project rules before the first component is written. Establish offline-first immutable schema bounds.
- **Repository Rules:** The UI Blueprint is officially treated as the Immutable Contract. No "on-the-fly" functional additions allowed without a preceding UI Draft update and CEO signoff. 
- **Tooling:** React (Vite), Firebase (Firestore + Cloud Functions + Authentication locally emulated). `lucide-react` for parity with blueprint iconography, `tailwindcss` for precise alignment.

## Phase 1: Boat Operator MVP
- **Focus Scope:** `role_boat` isolated flow mapped directly to `build_boat.py` outputs.
- **Target Audience:** Captains operating in offline environments.
- **Components Required:** 
  1. `BoatStartShift` (Local auth and bound context initialization)
  2. `BoatWalletTracker` (Derived wallet logic display)
  3. `LocalCatchReceiving` (Document Form Type: `REC` - Owned)
  4. `OutsideBuyReceiving` (Document Form Type: `REC` - Bought)
  5. `TripExpenseInput` (Document Form Type: `EXP`)
  6. `TripClosure` (Yield generation, net logic execution, zero-out, and print view block)
- **Definition of Done (DoD 1):** From a completely wiped database, a test script successfully spins up a Captain role, executes a closed-loop trip offline, reconnects, syncs writes properly to Firestore, and zero-sum closes the local wallet with no infinite loops.

## Phase 2: Middle-Layer Extensibility (Factory, CS, Admin)
- **Focus Scope:** `role_factory`, `role_cs`, `role_office`, `role_locationmgr` mapped directly to `build_factory.py`, `build_cs.py`, `build_office.py`, `build_loc_fin.py` (Manager context).
- **Target Audience:** Hub Workers and Processors in semi-connected settings.
- **Components Required:**
  1. `InboundCrossDock` (Comparing DO Transfer inputs to actuals)
  2. `ProcessingBatchForm` (Converts whole fish SKU metrics against raw limits into Fillet A/B mapping yields)
  3. `DispatchTransfers` (Document Form Type: `TRF` Outbound)
  4. `GlobalStockScanner` (Location Manager tree hierarchy mapped against active unit scopes)
- **Definition of Done (DoD 2):** Trip closed by Boat -> Receive into Factory -> Process Batch -> Transfer to Cold Storage -> Readout via Location Manager yields correctly aligned values at each step.

## Phase 3: Head Office Control (Finance, CEO, Shark AI)
- **Focus Scope:** `role_finance`, `role_ceo`, `role_investor`, `role_shark` mapped directly to `build_loc_fin.py` (Finance context), `build_ceo_inv.py`, `build_admin_shark.py`.
- **Target Audience:** High-level corporate validation and overarching anomaly sweeps.
- **Components Required:**
  1. `FinanceLedgerBoard` (Double-entry raw aggregation mapped to COA)
  2. `PaymentRunEngine` (Batch clearing AR/AP outstanding flags)
  3. `CEOHealthPulse` (Aggregated high-order charts reading direct from materialized views)
  4. `SharkAIEngine` (Cloud Function chron job analyzing standard deviations on yield/expense logic to flag limits automatically)
- **Definition of Done (DoD 3):** Finance executes a multi-trip Batch Settlement Payment correctly zeroing AR/AP balances against Master BCA Node. Shark successfully outputs a fraud flag into the dashboard.

## Security & offline Synchronization Method
We must operate using **Event-Sourced Sub-Transactions** mapped locally using `idempotency_keys` triggered by UI button clicks. A wallet balance is calculated by aggregating these events, *never* blindly overwritten.

## Top 15 Risks & Mitigations
1. **Network Disconnects during Write**: Handled via Firestore Offline Persistence limits.
2. **Double-Click Submissions**: Blocked logically via globally-unique Idempotency UUID generation.
3. **Negative Wallets Flow**: UI bounds limits checks; backend fails gracefully if `available_balance < req_amount` upon sync replay.
4. **App Update Desync**: Handled via forced reload on version mismatch token fetch.
5. **Unauthorized Node Access**: Bound tightly via Firestore Matrix Rules (Admin hard-bound contexts).
6. **Data Sprawl**: Subcollections used logically `locations/{locId}/units/{unitId}/trips/{tripId}`. 
7. **Cross-Shift Overlaps**: Strict `shift_status: "CLOSED"` flags blocking trailing document additions.
8. **Malicious Date Overrides**: Stamped server-side via `FieldValue.serverTimestamp()`.
9. **Role Escalation**: Hard-coded mappings within JWT claims synced via Firebase Auth.
10. **Cloud Function Cold Starts**: Minimal modularization to ensure fast boot.
11. **Print Inconsistencies**: Forced CSS rules using `@media print` mimicking exactly the mockup bounds.
12. **Master Data Sync Mismatch**: Locales cache SKUs upon successful boot/network handshake. 
13. **Currency Conversion Creep**: All mathematical logic restricted strictly to Integers (`Rp`).
14. **Yield Exploit Formatting**: Bounds mapping checking if raw input > limit output, failing transaction mathematically if invalid.
15. **Shark AI Hallucination**: Shark AI triggers *flags*, but never silent overrides (Requires human Loc Mgr override input).
