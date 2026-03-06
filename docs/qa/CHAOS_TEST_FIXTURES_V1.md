# Chaos Test Fixtures (Phase 0.5)

These synthetic scenarios validate the resilience of OPS3’s offline-first architecture. 

## 1. Wallet Conflict
- **Setup:** Two devices (App A, App B) operating identically, both authenticated under `Captain_1` scope for `Trip_X` with a `WalletEvent` sum of $100.
- **Execution Steps:** 
  1. Both apps enter offline mode.
  2. App A creates a $60 `expense_trip`.
  3. App B creates an $80 `expense_trip`.
  4. Both apps reconnect concurrently.
- **Expected Server Result:** App A's event arrives at `seq_num = N`. Sum becomes $40. App B's event arrives at `seq_num = N+1`. Sum becomes -$40. Server recognizes overdraft.
- **Expected Client Behavior:** App A resolves silently. App B resolves but converts its $80 expense to generate a $40 `PayableEvent` debt to the captain.
- **Audit Log Entries:** `OVERDRAFT_CREATED`.

## 2. Inventory Race
- **Setup:** Factory Hub holds exactly 100kg of Batch `Tuna_A`.
- **Execution Steps:** 
  1. iPads C & D go offline.
  2. C sells 100kg of `Tuna_A` to Vendor X.
  3. D sells 100kg of `Tuna_A` to Vendor Y.
  4. Both reconnect and sync.
- **Expected Server Result:** C event accepted. D event rejected via Backend Invariant check `SUM(events) >= 0`.
- **Expected Client Behavior:** D routes the failed sale to an Error Resolution Queue ("STOCK_DEFICIT").
- **Audit Log Entries:** `INVENTORY_COLLISION`.

## 3. Long Offline
- **Setup:** Boat begins trip.
- **Execution Steps:** 
  1. iPad E goes offline for 75 hours.
  2. User inputs 50 catch receipts and 20 expenses.
  3. iPad E reconnects to WiFi.
- **Expected Server Result:** Server reads the payload timestamps but assigns strictly consecutive monotonic `seq_num` values in a single atomic batch.
- **Expected Client Behavior:** Client blocks all interactions with a "Syncing Trailing Queue" spinner until server ACK.
- **Audit Log Entries:** `STALE_SYNC` (if prices changed in the interim).

## 4. Clock Skew Attack
- **Setup:** Time zone tampering.
- **Execution Steps:** 
  1. User sets iPad F to 30 days in the future to bypass a closure deadline.
  2. Submits expense. Syncs.
- **Expected Server Result:** Firestore Security Rules bind the transaction sequence explicitly to `request.time`. The client timestamp is logged but ignored for validation.
- **Expected Client Behavior:** Expense accepted but recorded as `request.time` (real server time today).
- **Audit Log Entries:** `CLOCK_SKEW_DETECTED`.

## 5. Partial Sync
- **Setup:** A heavy `transfer_initiated` containing 50 line items.
- **Execution Steps:** 
  1. Connect. Begin sync.
  2. Sever connection exactly midway during Firestore atomic commit.
- **Expected Server Result:** Atomic batch explicitly fails. Zero child documents created.
- **Expected Client Behavior:** Retains resume token. Recalculates `HMAC` payload consistency, retries entirely upon reconnection.
- **Audit Log Entries:** `SYNC_RETRY`.

## 6. Device Swap
- **Setup:** Device G dies mid-trip.
- **Execution Steps:** 
  1. Operator copies the raw IndexedDb blob to Device H.
  2. Operator attempts to login and sync locally extracted queue.
- **Expected Server Result:** Device Signature `HMAC` will not match the new device's cryptographic material. Cloud Function blocks the queue execution.
- **Expected Client Behavior:** Sync rejection indicating "Signature Mismatch".
- **Audit Log Entries:** `DEVICE_MIGRATION_BLOCKED`.
