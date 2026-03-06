# Offline Conflict Test Matrix

This matrix governs the QA processes for verifying the resilience of the Offline-First state architecture. All integration tests MUST simulate these specific conditions via the emulator suite.

| Case | Scenario | Expected Behavior |
| :--- | :--- | :--- |
| **Duplicate Submission** | Network stutters; client resends payload containing same UUID idempotency key. | `eventId` constraint intercepts duplicate. Second request succeeds silently via no-op. Only 1 event is recorded. |
| **Two Devices Offline Spend** | Boat Captain and Mate are both offline on separate iPads. Both spend Rp 100,000 from a Rp 150,000 trip wallet. Both sync. | Chronological First-In wins. Second sync attempts to trigger overdraft boundary. Rule: Boat soft overdraft triggers `PayableEvent` conversion for the deficit (Rp 50,000 debt). |
| **Transfer Initiate w/o Receipt** | Boat dispatches catch locally (`transfer_initiated`). Connects, syncs, then loses connection. Factory hasn't received. | Factory receives `transit` alert. Boat `inventory` shows 0. Catch is locked in `transit` ledger state until Factory connects and submits `transfer_received`. |
| **Receipt Duplicated** | Factory clicks "Accept Transfer" exactly as WiFi fails, spams button, reconnects. | Both requests contain the identical `transferId` + `received` tuple. Idempotency guarantees exactly one execution. |
| **Stock Consumed Twice Offline** | Offline Factory inputs Batch 1 using Stock A. Offline Office Admin sells Stock A. Both sync. | First request processes. Second request fails the Negative Inventory aggregation check. The second request is blocked and moved to the "Resolution Queue". |
| **Edit Posted Doc Attempt** | Malicious user intercepts offline request payload, modifies amount after doc timestamp locked, and syncs. | Security Rule evaluates `update` on an immutable document. Fails with `PERMISSION_DENIED`. |
| **Stale Local Snapshot** | User’s device is offline for 48 hours. Attempts a transaction based on 2-day old prices. | Cloud Function validates `priceRules` relative to `serverTimestamp`. Transaction is rejected due to stale reference pricing. |
| **Role Scope Violation** | Offline, an operator modifies their local JWT state to spoof an Admin transaction. | Firebase Admin validates cryptographic signature of token. Custom claims do not match. Payload rejected. |
| **Clock Skew / Backdate** | User changes device time backward to bypass a closure deadline and syncs. | Client timestamps are overridden by `serverTimestamp()` during Firestore commit. Deadline enforcement occurs relative to authoritative cloud time. |
