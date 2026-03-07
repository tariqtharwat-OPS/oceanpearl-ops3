# Phase 1 Boat Open Blockers

This document tracks technical and architectural blockers encountered during Phase 1.

## Gate 5 Closure Review
As of the completion of Gate 5, the following sub-systems have been verified:
- **Remittance Correctness**: PASS. Cash and Inventory are correctly swept out of boat scope via `transfer_initiated` events upon closure.
- **Closure Lock Integrity**: PASS. `trip_states` successfully transitions to `closed` and persists server-side.
- **Post-Closure Mutation Blocking**: PASS. Backend functions now perform pre-flight checks on trip status, effectively rejecting any expenses, sales, or receiving actions for closed trips.
- **Print/Report Completeness**: PASS. A4 preview screen provides the required layout for physical reconciliation with Hub Finance.

## Full Trip Simulation Review
- **System Stability**: PASS. No crashes or transaction deadlocks observed during E2E.
- **Ledger Continuity**: PASS. Mathematical reconciliation confirmed in `OPS3_LEDGER_RECONCILIATION_REPORT.md`.
- **User Error Resilience**: PASS. Double-click and back-navigation re-submission handled via idempotency.

---

## Remaining Blockers

### CRITICAL
- None.

### HIGH
- None.

### MEDIUM
- **Accounts Receivable Sub-Ledger**: "Receivable" sales are captured as intent in `documents` but not yet reflected in a dedicated AR tracking system. This is a known scope limitation for the Boat MVP and will be the first priority of Phase 2 (Hub/Finance).

### LOW
- **Manual Data entry for Crew Settlement**: Currently, crew advances and earnings are presentation-only in the closure screen. A dedicated Ledger for "Crew Wages" would allow for more automated end-of-trip calculations.
- **Real-time Inventory Balance in UI**: The UI uses static balance labels for fish. While the backend prevents stock deficits, the frontend experience would benefit from real-time `inventory_states` subscriptions in a future UX polish.
