# OPS3 Activation Plan

## Execution Order
The execution from the frozen UI (`ui-freeze-v1.1.2`) to the live system strictly follows an incremental phase model, validating the immutable event architecture before compounding complexity.

### Why Boat Operator MVP is First
The Boat Operator represents the most critical, highest-risk, and most decentralized aspect of the business. Capturing origin data (catch receiving, trip expenses, crew advances) securely at the edge establishes the foundation for all downstream operations. If the Boat MVP successfully implements the offline-first wallet and inventory event log without corruption or spoofing, the same architectural patterns will natively scale to the Factory and Cold Storage.

## Phase Sequence

### Phase 0: Safety Foundation
- **Focus:** Backend project structure, authentication, Firestore security rules, immutable event ledger architecture, offline conflict resolution harness, deployment pipelines.
- **Entry Criteria:** UI Freeze v1.1.2 approved and tagged.
- **Exit Criteria:** Secure empty shell deployed. All roles return correctly bound, unauthorized routes block. Schema passes invariant tests.
- **Definition of Done:** Infrastructure-as-code complete. Empty database passes security audits.

### Phase 1: Boat Operator MVP
- **Focus:** Implementation of `boat_*` screens. End-to-end trips, offline caching, receipt printing (Bluetooth), immutable ledger updates for catch, expense, and advances.
- **Entry Criteria:** Phase 0 Safety Foundation locked.
- **Exit Criteria:** Boat operator can conduct a full simulated trip offline, sync to cloud, and close session with zero reconciliation errors.
- **Definition of Done:** 8 boat screens functional. Integration tests pass. 100% test coverage on wallet invariants.

### Phase 2: Factory + Cold Storage + Office
- **Focus:** Receiving downstream data from boats. Batch processing, yield calculations, inter-unit transfers, cold storage inventory checks. Payables workflow in Office.
- **Entry Criteria:** Phase 1 Boat MVP deployed in production test environment.
- **Exit Criteria:** Full product lifecycle (catch → factory → storage → sale) complete.
- **Definition of Done:** All intra-company transfers execute cleanly with the two-phase commit pattern.

### Phase 3: Finance + CEO + Investor + Shark
- **Focus:** Read-heavy validation, reporting, aggregated dashboards, Shark AI anomaly detection.
- **Entry Criteria:** Phase 2 operations generating synthetic data successfully.
- **Exit Criteria:** Analytics match raw event sum perfectly. Shark AI successfully flags predefined fraud test cases.
- **Definition of Done:** System deployed to production, fully audited.

## Approval Gates
Each phase requires manual authorization from the Project Lead before the next phase's tasks are initiated. No backend implementations for a subsequent phase may begin prior to the explicit sign-off of the current phase.
