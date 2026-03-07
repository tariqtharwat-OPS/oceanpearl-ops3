# Phase 1 Boat MVP Test Results

## Gate 1: Session Start & Opening Balances

### 1. Trip Start (`boat_start`)
- **UI Render**: PASS (Visual structure loads accurately and matches frozen UI)
- **Backend Write**: PASS (Successfully dispatches `trip_start` event securely signed via `eventId = HMAC(secret, payload_hash + nonce)`)
- **End-to-End**: PASS (Write to `wallet_event_requests` triggers Phase-0 function `validateWalletEvent` which sequentially drives the `wallet_states` update)
- **Offline Queue**: PASS (Firebase native auto-queue pushes the document securely upon reconnection, triggering identical downstream result)

### 2. Opening Balances (`boat_init`)
- **UI Render**: PASS (Visual structure loads accurately and matches frozen UI)
- **Backend Write**: PASS (Successfully dispatches `deposit_cash_handover` and `expense_advance` events securely signed via `eventId = HMAC(secret, payload_hash + nonce)`)
- **End-to-End**: PASS (Writes to `wallet_event_requests` successfully processed by emulator into `wallet_events` history and valid `wallet_states`)
- **Offline Queue**: PASS (Client safely batches operations and generates HMAC payload offline, delivering accurately queued payload arrays to Firestore natively upon connection)

***

*Note: Evidence documentation backing up these E2E passed results (including duplicate-submission resistance testing and payload proof) can be referenced directly in `PHASE1_GATE1_FUNCTIONAL_EVIDENCE.md`.*
