# OPS3 Data Model: Offline Wallets

## Immutable Derivation
Wallet balances are strictly derived from an immutable stream of event transactions.
- **NO mutable balance fields** exist in the entity record. 

## Deterministic Ordering Rules
- **Server Sequence:** To guarantee deterministic ordering independent of unreliable client clocks, the server assigns a strict monotonic sequence number (`seq_num`) to each event in a wallet stream at the moment of commit.
- **Client Timestamps:** Client `recordedAt` timestamps are preserved for context, but are NOT authoritative for state ordering.
- **Order of Evaluation:** Reducers reconstruct balance state purely based on the server-assigned `seq_num`.

## Balance Snapshot Strategy
- To prevent `O(n)` recalculation on long-running wallets (e.g., Hub Master Wallet), the system emits `SnapshotEvent` records periodically (e.g., daily or every 100 transactions).
- The snapshot mathematically seals the balance up to a specific `seq_num`. Future recalculations only aggregate events that occurred *after* the latest snapshot.

## Idempotency Strategy
- **Duplicate Prevention:** Every `WalletEvent` requires a client-generated UUIDv4 (`eventId`). Firestore rejects duplicates natively.
- **Zombie Retries:** A strict expiry window is enforced. An offline device returning after weeks cannot submit a zombie transaction without admin review.
- **Replay Protection:** The idempotency key is cryptographically bound to a hash of the payload integrity. If the payload is tampered with on retry, it yields a mismatched signature and is hard-rejected.

## Two-Phase Transfer Logic
Transfers between physical entities are strictly two-phase to reflect physical cash in transit:
1. `transfer_initiated`: Origin wallet decreases. State becomes `transit`.
2. `transfer_received`: Destination wallet increases.
3. `transfer_cancelled`: Origin wallet reverses the reduction.
4. `transfer_expired`: Automatically triggered if transit remains unresolved beyond SLA. Requires admin reconciliation.
*Crucially: the destination balance does not increase until physical receipt is digitally confirmed.*

## Partial-Sync and Retry Handling
- Sync operates using Firestore atomic batches.
- If a batch exceeds size limits, the client segments it chronologically.
- If a network drop occurs mid-batch, successful segments are retained. The local queue tracks strict acknowledgment from the server before removing events.
- Dependent events (e.g., an expense relying on a prior transfer receipt) are topologically sorted locally prior to sync.

## Overdraft Rejection Rules
- **Boat Wallets:** Soft boundaries. If expenses > wallet, a `PayableEvent` is spawned representing debt to the Boat Captain.
- **Hub/Factory Wallets:** Hard boundaries. Physical vault limits are enforced server-side.

## Offline Sync Reconciliation Model
- The client UI explicitly differentiates between **Server Confirmed Balance** and **Optimistic Local Balance**.
- Subscriptions force convergence with the authoritative server ledger upon reconnect.
