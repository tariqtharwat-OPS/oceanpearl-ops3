# OPS3 Activation Plan

## Execution Order
The execution from the frozen UI (`ui-freeze-v1.1.2`) to the live system strictly follows an incremental phase model. We validate the immutable event architecture under extreme conditions before compounding complexity. 

### Phase Sequence
1. **Phase 0 — Safety Foundation**
   - Backend skeleton, strict repo hygiene, environments, offline-first routing bounds, security rules, and database schema lock.
   - *Approval Gate: Architecture and Security Review Sign-off.*
2. **Phase 0.5 — Staging / Chaos Validation**
   - Deployment to a production-like staging environment.
   - Intensive simulation of edge cases: sync conflicts, network drops/reconnects, clock skew, duplicate submissions, device swaps (queue migration), long-offline states, and rollback/contra-event tests.
   - *Approval Gate: Chaos Test Matrix 100% Pass.*
3. **Phase 1 — Boat MVP**
   - Implementation of `boat_*` screens. End-to-end trips, offline caching, receipt printing, immutable ledger updates.
   - *Approval Gate: Boat Operator Acceptance Test Sign-off.*
   - **Phase 1 Success Criteria:**
     - Zero ledger inconsistencies after conflict tests.
     - Zero negative stock after sync tests.
     - Role/scope penetration tests pass cleanly.
     - Offline print reconciliation matches cloud perfectly.
     - Recovery works flawlessly after failed sync or dropped network.
4. **Phase 1.5 — Rollback / Recovery Validation**
   - Live validation of recovering corrupted or erroneous operator inputs in the real world via Contra-Events and Admin intervention, without breaking downstream states.
   - *Approval Gate: Governance & Audit Sign-off.*
5. **Phase 2 — Factory + Cold Storage + Office**
   - Receiving downstream data. Batch processing, yield calculations, inter-unit physical transfers. Payables workflow in Office.
   - *Approval Gate: Intra-Company Operations Sign-off.*
6. **Phase 3 — Finance + CEO + Investor + Shark advanced features**
   - Read-heavy validation, aggregated insights, advanced Shark AI anomaly detection and reporting workflows.
   - *Approval Gate: Final Executive Sign-off.*

## Why Boat Operator MVP is First (After Chaos Testing)
The Boat Operator represents the most critical, highest-risk, and most decentralized aspect of the business. Capturing origin data (catch receiving, trip expenses, crew advances) securely at the edge establishes the foundation for all downstream operations. Proving it works in Phase 0.5 and 1 means the architectural patterns will natively scale to the Factory and Cold Storage.

## Entry / Exit Criteria per Phase
- **Entry Criteria:** 100% completion of the previous phase's Definition of Done and signed explicit approval gate. Continuous integration pipelines pass.
- **Exit Criteria:** Zero P0/P1 bugs. 100% test coverage on new critical ledger operations. Operations are fully documented. User acceptance testing completed.
- **Definition of Done:** Infrastructure-as-code complete where applicable. End-to-end user flows execute successfully on real devices in the staging environment.
