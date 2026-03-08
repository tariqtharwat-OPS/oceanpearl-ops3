# Boat Operator Final Specification (Production Freeze)

**Version:** boat-mvp-production-v1
**Commit Hash:** d8877f4ddd2a129b0f8531c32251c68a2f4c7094
**Ruleset:** OPS3-V1-Strict

## 1. System Architecture
The Boat Operator MVP operates on a **Document-Centric Ledger Pattern**. No client-side code writes directly to the final state collections (`documents`, `wallet_states`, `inventory_states`, `trip_states`).

### 1.1 Write Path
1.  **Client UI:** Collects data in 'Draft' state.
2.  **Request Inbox:** Client signs payload and writes to `document_requests` (or `wallet_event_requests`).
3.  **Backend Validation:** Firebase Cloud Functions (`validateDocumentRequest`) verify HMAC signature and idempotency.
4.  **Ledger Post:** Function executes a multi-document atomic transaction to create the immutable document and update the trailing balance states.

## 2. Content & Workflows

### 2.1 Trip Lifecycle
1.  **START:** (`trip_start` event) Initializes the trip ID and locks the staff roster.
2.  **OPENING:** (`deposit_cash_handover`) Sets the initial physical cash balance on board.
3.  **OPERATIONS:**
    *   **Receiving (Own):** Onboards fish with 0 cost basis.
    *   **Receiving (Buy):** Onboards fish + generates Cash Payment or AP Liability.
    *   **Expenses:** Deducts cash from trip wallet.
    *   **Sales:** Generates revenue (Cash/AR) and decrements inventory.
4.  **CLOSURE:** (`trip_closure`) Marks the trip as `closed`. No further events allowed. Transfers all remaining balances (Inventory/Cash) to the Hub Warehouse/Treasury.

### 2.2 Event Model
| Event Type | Collection | Effect |
|------------|------------|--------|
| `deposit_cash_handover` | `wallet_events` | Increase wallet balance |
| `expense_trip` | `wallet_events` | Decrease wallet balance |
| `receive_own` | `inventory_events` | Increase boat stock |
| `sale_out` | `inventory_events` | Decrease boat stock |

### 2.3 Trip Locking
Once a `trip_states` document reaches `status: "closed"`, the Cloud Function triggers will reject any further event requests referencing that `trip_id`. This is the core immutability guarantee.

## 3. Reliability & Offline
*   **Idempotency:** Every request contains a `nonce` and `idempotency_key`. The system uses `idempotency_locks` to prevent double-processing.
*   **Offline Persistence:** Firestore local cache allows the operator to record events while at sea. Writes sync automatically upon returning to port/cellular range.

## 4. Security Rules
*   **Deny-by-default:** Only authorized collections are exposed.
*   **Scope Isolation:** Read access is restricted to the user's `unit_id` and `location_id` via JWT custom claims matching document metadata.
*   **Immutable Documents:** Clients cannot update or delete documents once created.
