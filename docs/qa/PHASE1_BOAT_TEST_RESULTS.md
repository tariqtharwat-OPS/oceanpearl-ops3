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

## Gate 2: Trip Expenses

### 3. Trip Expenses (`boat_exp`)
- **UI Render**: PASS (Visual structure aligns perfectly with the frozen UI blueprint, including variable multi-line invoice structure)
- **Backend Write**: PASS (Dispatches a monolithic `document_requests` payload containing multiple expense lines mapped explicitly to `wallet_id` and `event_type`)
- **End-to-End**: PASS (The backend intercepts the request in `validateDocumentRequest`, locks for idempotency, generates the immutable `documents` record, and then systematically calculates and decrements the balances inside a safe bulk transaction affecting `wallet_states` and synthesizing sequential `wallet_events`)
- **Offline Queue**: PASS (Creation works when device is offline; indexedDB persistence accurately caches the payload and successfully flushes out the HMAC-signed queue to `document_requests` securely once network restores)
- **Duplicate Submission**: PASS (Idempotency locking works. The duplicate identically signed payload overwrites the document request, but fails the `IDEMPOTENCY_REJECT` lock internally due to matching HMAC without causing any duplicate `wallet_events`)
- **Multi-line Invoice Details**: PASS (Adding and removing unlimited variable rows functions properly; payloads aggregate the single total correctly while the backend correctly issues parallel wallet events matching every sub-line item)

***

## Gate 3: Fish Receiving

### 4. Receiving Own Catch (`boat_own`)
- **UI Render**: PASS (Visual structure aligns with blueprint, teal/cyan theme applied)
- **Backend Write**: PASS (Dispatches individual `inventory_event_requests` for each fish SKU being onboarded)
- **End-to-End**: PASS (Backend `validateTransferEvent` correctly sequences the incoming weight into `inventory_states` scoped by `location_id`, `unit_id`, and `sku_id`)
- **Offline Queue**: PASS (Tested by disabling network; requests queue in IndexedDB and flush sequentially upon reconnect, maintaining deterministic inventory sequence)

### 5. Receiving Purchase From Fishermen (`boat_buy`)
- **UI Render**: PASS (Visual structure aligns with blueprint, indigo theme applied)
- **Backend Write**: PASS (Dispatches a monolithic `document_requests` payload containing SKU weights and financial settlement requirements)
- **End-to-End**: PASS (The updated `validateDocumentRequest` backend function handles atomic dual-impact: creating the `documents` record, incrementing `inventory_states`, and decrementing `wallet_states` if cash settlement is chosen. All updates are performed inside a single transaction to prevent race conditions)
- **Inventory Sequence Ordering**: PASS (Each purchase line receives a strict, deterministic `sequence_number` in `inventory_events` matching the state transition)
- **Duplicate Submission Safety**: PASS (HMAC idempotency ensures that clicking 'Post' twice results in a single document and single sets of events being created)

***

*Note: Evidence documentation backing up these E2E passed results (including duplicate-submission resistance testing and payload proof) can be referenced directly in `PHASE1_GATE1_FUNCTIONAL_EVIDENCE.md`.*
