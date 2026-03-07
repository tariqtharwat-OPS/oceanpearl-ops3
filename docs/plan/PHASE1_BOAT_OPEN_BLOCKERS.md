# Phase 1 Boat Open Blockers

Current status of identified technical or operational blockers.

## CRITICAL
- None. (Gate 3 remediation resolved rules and backend stability issues).

## HIGH
- None.

## MEDIUM
- **Manual Data Reconciliation**: Currently, "Receivable" sales are recorded in `documents` but not yet reflected in a specific `accounts_receivable` sub-ledger. This is expected as per Gate 4 scope (only recording the intent/document). Hub Finance implementation will address the settlement.

## LOW
- **SKU Balance Pickers**: The UI displays static balance labels (e.g., "[Bal: 120.5kg]"). Real-time balance fetching from `inventory_states` for the frontend picker is a nice-to-have for improved UX, but functional requirements are met via the backend invariant checks (preventing stock deficit).
