# Phase 1 Gate 5 Functional Evidence: Trip Closure

This document provides evidence of the Trip Closure implementation, including remittance and immutability locking.

## 1. Normal Trip Closure Example

### Request Payload (`document_requests`)
```json
{
  "document_id": "CLOSE-TRIP-B1-0226",
  "document_type": "trip_closure",
  "trip_id": "TRIP-B1-0226",
  "total_amount": 6500000,
  "lines": [
    {
      "wallet_id": "TRIP-WALLET-B1",
      "payment_amount": 6500000,
      "payment_event_type": "transfer_initiated",
      "destination_wallet_id": "HUB-TREASURY-01",
      "source_screen": "boat_close"
    },
    {
      "sku_id": "snapper-grade-a",
      "amount": 145.5,
      "event_type": "transfer_initiated",
      "location_id": "Kaimana-Hub",
      "unit_id": "Boat Faris",
      "destination_location_id": "Kaimana-Hub",
      "destination_unit_id": "HUB-WAREHOUSE",
      "source_screen": "boat_close"
    }
  ]
}
```

### Result Analysis
1. **Wallet Remittance**: `TRIP-WALLET-B1` balance reduced to 0; `HUB-TREASURY-01` increases by 6.5M.
2. **Inventory Remittance**: 145.5 KG of `snapper-grade-a` transferred out of `Boat Faris` to `HUB-WAREHOUSE`.
3. **Trip State Locked**: `trip_states/TRIP-B1-0226` updated to `{ "status": "closed", ... }`.

---

## 2. Duplicate Closure Example
- **Action**: Same closure document (matching HMAC) submitted twice.
- **Expected Behavior**: First request succeeds; second request is rejected by `idempotency_locks` with `IDEMPOTENCY_REJECT`.
- **Proof**: Only one transfer is initiated; wallet/inventory balances remain correct.

---

## 3. Offline Closure Example
- **Action**: "Post Document" clicked while disconnected.
- **Mechanism**: Request queues in Firestore local storage (IndexedDB).
- **Reconnect**: Once network returns, HMAC is verified, and the transaction executes the closure and remittance atomically.

---

## 4. Immutability Example (Locking)
- **Action**: Attempting to post any new action (e.g., a new expense) against `TRIP-B1-0226` after it has been closed.
- **Payload**:
```json
{
  "trip_id": "TRIP-B1-0226",
  "event_type": "expense",
  "amount": 1000
}
```
- **Backend Response**:
`Error processing request: TRIP_CLOSED: Cannot post further events to a closed trip.`
- **Result**: Request fails validation in `validateWalletEvent`, `validateTransferEvent`, or `validateDocumentRequest`, preserving the trip's final state.
