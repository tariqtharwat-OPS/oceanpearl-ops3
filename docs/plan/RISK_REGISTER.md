# OPS3 Risk Register

| ID | Risk | Trigger | Impact | Prevention | Detection | Recovery |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R01 | Offline Data Loss | Device destroyed before sync | Permanent data loss for trip | Frequent background sync when online | User reports missing device | Reconstruct from physical receipts if any |
| R02 | App Cache Clearing | User manually clears browser data | Loss of pending offline queue | PWA Installation education, UI warnings | Sync errors upon reconnect | Re-enter missing data from paper |
| R03 | Double Spend Offline | 2 devices spend same wallet | Cash deficit on boat | Architecture forces negative balance to AP | Server-side reconciliation flags | Resolve AP debt with captain |
| R04 | Clock Skew Fraud | Device time altered to backdate | Invalid financial reporting periods | Use `serverTimestamp()` only | Audit logs show disparate timestamps | Admin overriding contra-event |
| R05 | Phantom Inventory | Fake receive event injected | Unbacked stock for sale | Strict role constraints | Shark AI flags abnormal yields | Manual physical count & void |
| R06 | Sync Conflict Loop | Idempotency fails | Duplicate ledgers | UUIDv4 generation standard | Database index constraint violation | Automatic rewrite via queue monitor |
| R07 | Lost Transit Stock | Receiver never accepts transfer | Stock stranded in `transit` state | System strictly warns on close session | Dashboard highlights aged transit | Admin force-reverts transfer |
| R08 | Malicious User Downgrade | User intercepts JWT to upgrade scope | Unauthorized access | Admin verifies custom claims | Auth logs | Revoke token, suspend user |
| R09 | Stale Offline Pricing | Pricing updates while boats offline | Wrong payouts to fishermen | Cloud validations strictly deny stale data | Transaction rejection | UI prompts for manual price override approval |
| R10 | API Rate Limiting | Massive sync event hits quota | Entire fleet stuck offline | Batch writes utilizing Firestore limits | Firebase quota alerts | Auto backoff and retry strategy |
| R11 | PWA Update Failure | Service worker traps old code | Broken features run offline | Aggressive clear-cache strategy on load | Sentry tracks version errors | Force refresh via PWA banner |
| R12 | Print Spooler Hang | Thermal printer disconnects | Missing physical proof of transaction | Bluetooth reconnect routines | UI timeout | Reprint function available on posted docs |
| R13 | Accidental Session Close | Operator closes boat trip prematurely | Cannot log further expenses | UI confirmation dialog double-check | State machine prevents `re-open` | Must initiate new trip and link |
| R14 | Yield Calculation Error | Factory batch outputs impossible kg | Corrupted inventory value | Invariant check: Output <= Input * 1.05 | Shark AI anomaly | Void batch and redo |
| R15 | Cross-tenant Data Leak | Rule misconfiguration | Total security failure | Unit tests enforce deny-by-default rules | Regular security audits | Immediate lockdown and rule patch |
| R16 | Overdraft Beyond Float | Operator gives too much cash | Real cash loss | Limit `expense_advance` by explicit wallet available | Cash drawer reconciliation fails | Deduction from operator salary |
| R17 | Vendor Name Collision | Free-text vendor mismatches | AP accounting mess | Pre-populated vendor dropdowns | End of month ledger matching | Admin merging vendors |
| R18 | Device Theft during Trip| iPad stolen while unlocked | Fraudulent entries | Short auto-lock timeouts | User reports theft | Immediate token revocation |
| R19 | Failed Catch Migration | Legacy system DB port corrupts | Incorrect starting balances | Run dry-run migration scripts and verify | Shark AI detects structural errors | Re-run script from backup |
| R20 | Shark AI Hallucination | AI flags false negatives | Alert fatigue to CEO | Strict prompt engineering, scoped contexts | High volume of ignored flags | Tune AI prompt weights |
| R21 | Spoilage Hidden in Yield | Waste marked as byproduct | Financial fraud | Strict definition of byproduct vs waste | Yield metrics diverge from historical | Factory audit |
| R22 | Unsynced Document Print | Prints receipt before cloud commit | Lack of non-repudiation | Watermark "UNSYNCED DRAFT" | Audits compare physical to cloud | Enforce online print rules where possible |
| R23 | Over-allocating Advances | Crew takes advance exceeding catch share | Financial loss | Pre-trip advance limits | End of trip settlement | Carry debt to next trip |
| R24 | Document Void Cascade | Voiding received doc breaks batch | Broken state machines | Void checks downstream dependencies | Cloud function exceptions | Force manual unwinding by Admin |
| R25 | Incomplete Sync | App closed mid-sync batch | Fragmented trip state | Atomic batch writes in Firestore | Monitor pending operations | Auto-resume atomic write |
| R26 | Index Explusion | Firestore composite indexes limit | App crashes on complex queries | Optimize querying architecture early | Query execution failures | Refactor query or add index |
| R27 | Unhandled Promise Rejection | UI freezes | Operator abandons app | Global React error boundary | Sentry error tracking | Operator restarts app |
| R28 | Missing ID Generation | Offline UUID library fails | Document overwrite | Secure random generator validation | Overwritten data logs | Fallback to timestamp + random string |
| R29 | Cloud Function Timeout | Heavy month-end aggregation fails | Reports stall | Implement pagination and background workers | Timeout logs | Rerun failed workers manually |
| R30 | Incorrect Grade Input | Grade A marked as Grade C | Lost revenue | UI UX flow designed to verify critical data | Yield profitability analysis | Adjust during factory receiving |
| **R31** | **Event Ordering Non-Determinism** | **Client timestamps rely on local clock** | **Corrupt derived ledger state** | **Server assigns absolute monotonic `seq_num`** | **Aggregation scripts fail invariant checks** | **Admin manual seq_num restructuring** |
| **R32** | **Partial Batch Write Failure** | **Network drops mid-batch** | **Fragmented relational state** | **Enforce Firestore atomic transactions `batch.commit()`** | **Local queue monitor flags lingering parts** | **Auto-retry entire atomic block** |
| **R33** | **Transfer Expiry Gaps** | **Transit stock sits indefinitely** | **Phantom inventory locks** | **State machine adds `expired` auto-trigger SLA** | **Transit aging dashboard flags** | **Admin forces revert to sender** |
| **R34** | **Long-Offline Token Expiry** | **JWT expires while deep sea** | **Sync blocked upon reconnect** | **Silent refresh token buffering in service worker** | **Auth log shows 401s on reconnect** | **User forced to re-authenticate manually** |
| **R35** | **Shark AI Scope Leakage** | **Shark sees data outside user role** | **Major security breach** | **AI contexts explicitly stripped by backend middleware** | **Audit logs show AI querying wrong companyID** | **Immediate function disable & patch** |
| **R36** | **Physical Receipt Mismatch** | **Paper slip hashes ≠ Cloud ID** | **Dispute resolution fails** | **Print template enforces strict UUID barcodes** | **Finance operator flags disconnected paper trail** | **Manual ledger correlation** |
| **R37** | **Missing Staging Parity** | **Staging environment lacks prod rules** | **False positive QA testing** | **Phase 0.5 strict IaC syncing for databases** | **Failed deployments to production** | **Re-sync staging environments** |
| **R38** | **Queue Migration Device Swap** | **Device dies, indexedDB transferred via backup to new device** | **Authentication mismatch on sync** | **Queue bound to user cryptographic material** | **Sync rejection showing mismatched signature** | **Wipe cache on new device, manual paper entry** |
| **R39** | **Void Cascade Corruption** | **Voiding a parent deletes child data without contra** | **Data hole destroying traceability** | **Explicitly block parent voids if children exist** | **Query failures tracing `source_batch_id`** | **Restore parent from backup, perform proper contra sequence** |
| **R40** | **Pricing Rule Version Mismatch** | **Offline user sells using V1 params, DB demands V2** | **Systemic reject of valid offline transactions** | **Record `price_version` in idempotency payload, allow fallback** | **Sync failure queue spikes during policy changes** | **Admin approves stale payloads as explicit exceptions** |
