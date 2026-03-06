# OPS3 Data Model: Offline Wallets

## Immutable Derivation
Wallet balances are strictly derived from an immutable stream of event transactions.
- **NO mutable balance fields** exist in the entity record. If a wallet's current balance is needed, it is computed in real-time by reducing all associated `WalletEvent` documents.
- Server-side, Cloud Functions maintain an aggregated snapshot (`_currentBalance`) purely as an optimization cache, but it is not the source of truth.

## Transfer Two-Phase Pattern
To handle physical cash flowing across varying network states, transfers require a two-phase commit:
1. `transfer_initiated`: Emitted by the sender (e.g., Boat returning float to Hub). Reduces sender's virtual wallet.
2. `transfer_received`: Emitted by the receiver (e.g., Hub cashier). Increases receiver's virtual wallet.
- The state in-between represents "Cash in Transit".

## Idempotency Keys
- Every `WalletEvent` contains a client-generated UUID as its document ID.
- Network retries implicitly attempt to write the same document ID. Firestore inherently treats this as a no-op if the document already exists, preventing duplicate processing.

## Conflict Handling
- If an offline device processes 5 transactions, syncs, but another device operating the same wallet has already synced 3 conflicting transactions, Firestore correctly interleaves them chronologically by `recordedAt` timestamps.

## Overdraft Rejection Rules
- **Boat Wallets:** Soft boundaries. If expenses > wallet, a `PayableEvent` is automatically spawned recognizing debt to the Boat Captain.
- **Hub/Factory Wallets:** Hard boundaries. Physical vault limits are strictly enforced server-side.

## Offline Sync Reconciliation Model
- The client UI explicitly differentiates between **Server Confirmed Balance** and **Optimistic Local Balance**.
- Upon network restore, queued local events are pushed to Firestore.
- Subscriptions update the local cache, forcing convergence with the authoritative server ledger.
