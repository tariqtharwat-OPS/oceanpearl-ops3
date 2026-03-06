# Offline Conflict Test Matrix

This matrix governs QA processes for the Operational offline state architecture. All integration tests MUST simulate these specific conditions via the emulator suite.

| Scenario | Setup | Expected Behavior | Rejection/Acceptance Rule | Recovery Path | Audit Expectation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Duplicate Submission** | Network spams same `eventId` | First succeeds, identical retries silent no-op. | Payload idempotency exact match. | N/A | None. |
| **Two Devices Overspend Wallet** | Boat Captain and Mate offline on separate iPads. Spend same float. Sync. | Chronological First-In wins. Second sync triggers overdraft boundary. | Accept first. Second converts to `PayableEvent` debt. | Operator pays debt to company. | Log `OVERDRAFT_CREATED`. |
| **Two Devices Consume Same Stock** | Factory offline iPad 1 & 2 attempt to process final 100kg of Batch A. Sync. | First sync succeeds. Second sync attempts to drive stock negative. | Reject second sync via `STOCK_DEFICIT`. | Failed event moves to Resolution Queue. Operator physical counts. | Log `INVENTORY_COLLISION`. |
| **Partial Sync Failure** | Document has 5 batches. Network drops on batch 3. | Entire document write fails OR succeeds atomically. | Firestore Batch writes must hold ALL or NOTHING. | Retry entire batch upon reconnect. | Log `SYNC_RETRY`. |
| **Transfer Initiated, Not Received** | Boat sends stock. Loses connection. Origin syncs, Dest does not. | Stock locked in `transit` ledger state. Origin stock drops. Dest stock unchanged. | Wait for `transfer_received` from Dest. | Dest connects and accepts, or Admin invokes `transfer_expired`. | Log `AGING_TRANSIT`. |
| **Duplicate Transfer Receipt** | Factory clicks "Accept", WiFi fails, spams button, reconnects. | Exactly one `transfer_received` event occurs. | Idempotency matches `transferId` + `received` tuple. | N/A | None. |
| **Long Offline Duration (72h+)** | Boat connects after 4 days offline. | Cloud accepts if data valid, but flags stale configuration. | Depends on pricing validity window. Rejects if prices updated. | Push to Admin resolution queue for manual override. | Log `STALE_SYNC`. |
| **Device Clock Skew / Future Time** | User sets iPad to 2030 to bypass deadline. Syncs. | Client timestamps discarded for ledger ordering. | Cloud enforces sequence via `request.time` (serverTimestamp). | N/A | Log `CLOCK_SKEW_DETECTED`. |
| **Device Swap / Queue Migration** | iPad breaks offline. DB extracted, moved to new iPad. Syncs. | Events accepted but flagged. | Events mapped to new `deviceId`. Signature validation checks integrity. | Sync proceeds if signature valid. | Log `DEVICE_MIGRATION`. |
| **Stale Snapshot at Post Time** | User views stock at 100kg, goes offline. Sells 50kg. Meanwhile factory sells 100kg online. User syncs. | User's sync relies on 100kg but actual is 0kg. | Rejected via `STOCK_DEFICIT`. | Sale moved to error queue. Contact customer. | Log `STALE_SNAPSHOT_VIOLATION`. |
| **Cloud Function Timeout** | Heavy aggregation limits reached. | Sync completes, aggregation fails. | Client data safe. Retriable function background loop catches it. | Cloud Task retries with exp backoff. | Log `TIMEOUT_RETRY`. |
| **Rollback of Dependent Doc** | Attempt to void Catch Receipt after it was processed in Factory. | Reject attempt. | Dependency tree prevents upstream voids if downstream exists. | Recursively void downstream processing first (Contra-events). | Log `DEPENDENCY_VOID_BLOCKED`. |
