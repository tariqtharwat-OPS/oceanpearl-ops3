# OPS3 DATA MODEL: OFFLINE-FIRST WALLETS

## Core Principle: Event-Driven Derived States

In the physical world of fishing operations, boats and factories often operate outside of network connectivity boundaries. This necessitates an offline-first data model. A traditional monolithic mutable row (e.g., `Update Wallet SET balance = balance - 10`) is fundamentally unsafe in this environment.

Instead, the OPS3 system treats numerical financial or inventory balances exclusively as derived states mathematically aggregating an immutable ledger of transactions.

## Wallet Entity vs Wallet Transactions

**1. The Ledger (Wallet Sub-Transactions)**
Every time an operation happens (an expense is logged, cash is handed over, or a trip begins), the application generates an immutable event block containing:

- `transaction_id`: A UUID v4 idempotency key generated on the client.
- `wallet_id`: The target aggregate node (e.g., `WALLET_B1_TRIP_099`)
- `type`: Either `CREDIT` (+) or `DEBIT` (-).
- `amount`: Raw integer string.
- `document_ref`: Pointer to the parent document (e.g., `EXP-9921`).
- `timestamp`: The client-stamped creation time, enforcing chronology.
- `status`: Either `PENDING_SYNC`, `POSTED`, or `VOIDED`.

**2. The Aggregation (The Wallet Document)**
The Wallet itself acts simply as a caching snapshot node readable by the UI to easily display "available float." This relies on a backend Cloud Function listening to the `transactions` subcollection and actively maintaining a sum. 

## The Negative-Balance Prevention Strategy

If an entity generates expenditures locally exceeding their granted float *while offline*, the client-side UI will soft-block the action mathematically (`available_balance < req_amount`).

However, if a malicious client bypasses this, the fundamental safeguard lies in the backend Firestore Rules paired with Cloud Function sync logic. When the connection is restored, the array of events hits the queue. The backend sequentially attempts to apply writes. If applying `DEBIT 1,000,000` drives the aggregated snapshot below zero, the entire transaction is rejected and the offending document is flagged as `FAILED_SYNC_NSF` (Non-Sufficient Funds).

## The Transfer Two-Phase Commit Pattern

To move value from `Kaimana Hub Treasury` (Location Mgr) to `Trip Cash B1` (Boat Captain) requires explicitly a two-phase architecture mirrored by our UI freeze:

1. **Pending Phase (Dispatch):** Location Manager creates a transfer document (`TRF`). A `DEBIT` hits Kaimana's Wallet. A `CREDIT` appears in Boat B1's Wallet, but uniquely tagged as `state: PENDING`. The money is effectively in transit.
2. **Receipt Phase (Acceptance):** The Boat Captain, physically receiving the envelope, clicks the "Receive Cash" button (as frozen in the blueprint). This writes a formal receipt signature event to the same `TRF` doc, flipping the `CREDIT` to `state: POSTED`.

*If the funds are never accepted, they remain visibly floating between entities, triggering a Shark AI float anomaly.* 

## UI Blueprint Mapping
This data model directly maps to the froze UI blueprint structures. For example:
- **`boat_wallet`** or **`fac_wallet`**: The table grids explicitly display the mathematical ledger of historical Txns mapped against a running balance.
- **`loc_app_recv`**: Reconciles the Two-Phase commit state visually.
- **`fin_ledg`**: Directly outputs the raw global sum aggregation in real-time.
