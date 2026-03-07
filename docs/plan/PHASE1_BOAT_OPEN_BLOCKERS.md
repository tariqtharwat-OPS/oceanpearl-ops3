# Phase 1 Boat Open Blockers

Current status of identified technical or operational blockers.

## CRITICAL
- None. (Gate 5 closures successfully implement immutability locking).

## HIGH
- None.

## MEDIUM
- **Manual Data Reconciliation**: "Receivable" sales are recorded in `documents` but not yet reflected in a specific `accounts_receivable` sub-ledger. This will be addressed during Hub Finance development.

## LOW
- **SKU Balance Pickers**: Frontend UI uses static balance labels. Real-time balance fetching for pickers is deferred for reporting phase UX optimization.
- **Crew Settlement Validation**: The settlement table in Gate 5 is a presentation of calculated profit share. Future phases will need a dedicated "Crew Wage" ledger to track these accruals automatically from catch/sale records.
