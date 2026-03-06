# OPS3 Activation Plan

## Execution Order
The execution from the frozen UI (`ui-freeze-v1.1.2`) to the live system strictly follows an incremental phase model. We validate the immutable event architecture under extreme conditions before compounding complexity. 

### Phase Sequence

1. **Phase 0 — Safety Foundation**
   - Backend skeleton, strict repo hygiene, environments, offline-first routing bounds, security rules, and database schema lock.
   - *Owner:* Lead Architect
   - *Approval Gate: Architecture & Security Review Sign-off.*
   - **Acceptance Criteria:**
     - 100% route boundary tests pass (zero unauthorized UI views).
     - Zero mutable fields present in `WalletEvent` and `InventoryEvent` schemas.
     - Zero successfully executed `update` or `delete` calls on immutable event collections.

2. **Phase 0.5 — Staging / Chaos Validation**
   - Deployment to a production-like staging environment. Intensive simulation of edge cases.
   - *Owner:* QA Lead
   - *Approval Gate: Chaos Test Matrix Pass.*
   - **Acceptance Criteria:**
     - Zero ledger inconsistencies after 100 simulated sync conflicts.
     - Zero database deadlocks or sync rejections after a 72-hour offline queue migration.
     - 100% data integrity recovery after simulated mid-batch network drops.

3. **Phase 1 — Boat MVP**
   - Implementation of `boat_*` screens. End-to-end trips, offline caching, receipt printing, immutable ledger updates.
   - *Owner:* Boat Operations Manager
   - *Approval Gate: Boat Operator Acceptance Test Sign-off.*
   - **Acceptance Criteria:**
     - Zero negative stock occurrences after 50 parallel sync tests.
     - Offline physical print reconciliation matches cloud UI 100% across 50 receipts.
     - Zero successful privilege escalations across unit boundaries.

4. **Phase 1.5 — Rollback / Recovery Validation**
   - Live validation of recovering corrupted operator inputs via Contra-Events and Admin intervention, without breaking downstream states.
   - *Owner:* Finance Lead
   - *Approval Gate: Governance & Audit Sign-off.*
   - **Acceptance Criteria:**
     - 100% downstream mathematical accuracy achieved after 10 multi-level document void cascades.
     - Zero orphaned stock records after 5 simulated `transfer_cancelled` / `expired` events.

5. **Phase 2 — Factory + Cold Storage + Office**
   - Receiving downstream data. Batch processing, yield calculations, inter-unit physical transfers. Payables workflow in Office.
   - *Owner:* Factory Manager
   - *Approval Gate: Intra-Company Operations Sign-off.*
   - **Acceptance Criteria:**
     - 100% batch traceability maintained backwards from Sale to initial Catch across 5 processing stages.
     - Zero negative inventory across all Hub operations.

6. **Phase 3 — Finance + CEO + Investor + Shark advanced features**
   - Read-heavy validation, aggregated insights, advanced Shark AI anomaly detection and reporting workflows.
   - *Owner:* CEO & Analytics Lead
   - *Approval Gate: Final Executive Sign-off.*
   - **Acceptance Criteria:**
     - Shark AI accurately identifies 100% of injected synthetic anomalies (fraud/yield traps).
     - Zero raw data leaked outside defined `company/location` scopes during 50 cross-tenant API requests.

## Why Boat Operator MVP is First (After Chaos Testing)
The Boat Operator represents the most critical, highest-risk, and most decentralized aspect of the business. Capturing origin data (catch receiving, trip expenses, crew advances) securely at the edge establishes the foundation for all downstream operations. Proving it works in Phase 0.5 and 1 means the architectural patterns will natively scale to the Factory and Cold Storage.

## Entry / Exit Criteria per Phase
- **Entry Criteria:** 100% completion of the previous phase's Definition of Done and signed explicit approval gate. Continuous integration pipelines pass.
- **Exit Criteria:** Zero P0/P1 bugs. 100% test coverage on new critical ledger operations. Operations are fully documented. User acceptance testing completed.
- **Definition of Done:** Infrastructure-as-code complete where applicable. End-to-end user flows execute successfully on real devices in the staging environment.
