# Screen Implementation Map: Boat Operator MVP

This mapping enforces the exact requirements to translate the `ui-freeze-v1.1.2` blueprint to React components for the Boat Operator role.

## 1. boat_start
- **React Component:** `BoatStartTrip`
- **UI Sections:** Trip ID generator, Location selector, Vehicle assignment, Captain assignment.
- **Event Documents:** `SessionEvent` (type: start).
- **Client Validations:** Must have active connectivity to verify user token/scope. Prevent duplicate active sessions.
- **Server Validations:** Ensure user has no existing open trip. Ensure vehicle is not assigned to another active trip.
- **Print Template required:** False.
- **Failure states:** Unauthorized access; Vehicle blocked.
- **Offline states:** Disabled. Trip initiation requires cloud validation to lock vehicle state.
- **Recovery states:** Silent token refresh before start.

## 2. boat_open
- **React Component:** `BoatOpenBalances`
- **UI Sections:** Cash Handover confirmation, Crew Advance allocations.
- **Event Documents:** `WalletEvent` (type: deposit_cash_handover), `WalletEvent` (type: expense_advance).
- **Client Validations:** Advance amount > 0. Sum of advances <= Handover amount.
- **Server Validations:** Server confirms originating branch has sufficient float for the handover.
- **Print Template required:** True (Handover Signature Slip).
- **Failure states:** Insufficient systemic float.
- **Offline states:** Supported locally; queued to outbox.
- **Recovery states:** Auto-retry via idempotency key on reconnect.

## 3. boat_exp
- **React Component:** `BoatTripExpense`
- **UI Sections:** Expense Type dropdown (Fuel, Ice, Provisions, Maintenance), Amount, Vendor Name, Notes.
- **Event Documents:** `WalletEvent` (type: expense_trip).
- **Client Validations:** Positive amounts only. Required notes for maintenance.
- **Server Validations:** Check for duplicate submission (idempotency). Calculate wallet delta.
- **Print Template required:** True (Expense Voucher).
- **Failure states:** Wallet overdraft (soft warning, allowed to go negative into payable).
- **Offline states:** Full support. Queued with timestamp.
- **Recovery states:** Replay queue on network restore.

## 4. boat_own
- **React Component:** `BoatReceiveOwnCatch`
- **UI Sections:** Species selection, Grade, KGs, Temp check.
- **Event Documents:** `InventoryEvent` (type: receive_own).
- **Client Validations:** KG > 0. Temperature within range.
- **Server Validations:** Validate species schema.
- **Print Template required:** True (Receiving Manifest).
- **Failure states:** Invalid species code.
- **Offline states:** Full support.
- **Recovery states:** Background sync.

## 5. boat_buy
- **React Component:** `BoatReceiveBuy`
- **UI Sections:** Fisherman lookup, Species, Grade, KGs, Agreed Price, Payment Method (Cash vs AP).
- **Event Documents:** `InventoryEvent` (type: receive_buy), `WalletEvent` (type: expense_purchase - if cash), `PayableEvent` (if AP).
- **Client Validations:** Price > 0. Cash selected requires sufficient wallet balance.
- **Server Validations:** Prevent double spend. Validate pricing constraints.
- **Print Template required:** True (Purchase Invoice & Receipt).
- **Failure states:** Hard stop if cash purchase exceeds trip wallet boundary without override.
- **Offline states:** Full support. If cash goes negative offline, AP is dynamically asserted on sync.
- **Recovery states:** Sync reconciliation flags overdrafts.

## 6. boat_sale
- **React Component:** `BoatSaleInvoice`
- **UI Sections:** Customer matrix, Species, KGs, Price.
- **Event Documents:** `InventoryEvent` (type: sale_out), `WalletEvent` (type: revenue_cash), `ReceivableEvent` (if credit).
- **Client Validations:** Sale KG cannot exceed local inventory snapshot.
- **Server Validations:** Server-side negative inventory block.
- **Print Template required:** True (Sales Invoice).
- **Failure states:** Insufficient inventory.
- **Offline states:** Allowed against local optimistic inventory snapshot.
- **Recovery states:** Event sourcing resolves offline parallel sales.

## 7. boat_wallet
- **React Component:** `BoatTripWallet`
- **UI Sections:** Derived wallet snapshot table, Cash return to float, Pending AP/AR.
- **Event Documents:** None (Read-only view of aggregated events).
- **Client Validations:** Local reducer matches offline event queue + last known server state.
- **Server Validations:** Server provides true aggregate.
- **Print Template required:** False.
- **Failure states:** Sync mismatch warning.
- **Offline states:** Shows "Optimistic Balance (Unsynced)".
- **Recovery states:** Auto-refresh on network active.

## 8. boat_close
- **React Component:** `BoatCloseTrip`
- **UI Sections:** Final stock tally, Final cash tally, Transfer Out logic, Session locking.
- **Event Documents:** `InventoryEvent` (type: transfer_initiated), `WalletEvent` (type: transfer_initiated), `SessionEvent` (type: close).
- **Client Validations:** All outbox queues must be empty. Cannot close while offline.
- **Server Validations:** Ensures sum of events exactly equals closing tallies. Hard locks session.
- **Print Template required:** True (Session Closure Audit).
- **Failure states:** Unsynced events block closure.
- **Offline states:** Disabled. Mandatory online connectivity to close trip.
- **Recovery states:** Wait for connection.
