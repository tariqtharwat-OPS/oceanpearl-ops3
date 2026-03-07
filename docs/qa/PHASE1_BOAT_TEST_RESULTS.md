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
- **Security Rules**: PASS (Firestore rules for `document_requests` now enforce auth and company/location/unit scope)
- **Malformed Payload Rejection**: PASS (Backend correctly identifies and rejects lines missing mandatory inventory fields with `MALFORMED_PAYLOAD` error)
- **UI Render**: PASS (Visual structure aligns with blueprint, teal/cyan theme applied)
- **Backend Write**: PASS (Dispatches individual `inventory_event_requests` for each fish SKU being onboarded)
- **End-to-End**: PASS (Backend `validateTransferEvent` correctly sequences the incoming weight into `inventory_states`)
- **Own Catch Pass**: PASS (Full flow verified under valid remediation rules)
- **Offline Queue**: PASS (Tested by disabling network; requests queue in IndexedDB and flush sequentially upon reconnect)

### 5. Receiving Purchase From Fishermen (`boat_buy`)
- **Security Rules**: PASS (Verified protection on `document_requests` collection)
- **UI Render**: PASS (Visual structure aligns with blueprint, indigo theme applied)
- **Buy Catch Pass**: PASS (Simultaneous dual-impact verified in remediated backend)
- **Inventory Sequence Ordering**: PASS (Strict deterministic sequence verified)
- **Duplicate Safety Pass**: PASS (HMAC idempotency verified)

***

## Gate 5: Trip Closure

### 8. Close Trip & Settle (`boat_close`)
- **UI Render Pass**: PASS (Visual structure aligns with blueprint, final audit and settlement tables displayed)
- **Inbox Write Pass**: PASS (Writes `trip_closure` docs to `document_requests` inbox)
- **Backend Processing Pass**: PASS (Cloud function handles `trip_closure` logic and remittance)
- **Cash Remittance Pass**: PASS (Remaining wallet balance successfully remitted to hub treasury)
- **Inventory Transfer Intent Pass**: PASS (Unsold stock marked as transfer-initiated back to hub)
- **Closure Immutability Pass**: PASS (Subsequent requests for a closed trip are rejected with `TRIP_CLOSED` error)
- **Offline Queue Pass**: PASS (Closure request survives offline/online transition)
- **Duplicate Submission Pass**: PASS (HMAC idempotency holds for closure documents)
- **Closure Print Pass**: PASS (A4 preview provides printable format for hub reconciliation)

***

## Gate 4: Boat Sales

### 6. Boat Sales (`boat_sale`)
- **UI Render Pass**: PASS (Visual structure aligns with blueprint, emerald theme applied)
- **Inbox Write Pass**: PASS (Writes to `document_requests` with correct HMAC and payload structure)
- **Backend Processing Pass**: PASS (`validateDocumentRequest` processes `sale_invoice` docs)
- **Inventory Deduction Pass**: PASS (`sale_out` event correctly reduces stock in `inventory_states`)
- **Cash Sale Wallet Credit Pass**: PASS (Setting payment to 'cash' results in `revenue_cash` wallet event)
- **Receivable Sale No-Wallet-Credit Pass**: PASS (Setting payment to 'receivable' omits wallet impact while preserving AR intent)
- **Atomic Dual-Impact Pass**: PASS (Single transaction handles both weight deduction and cash credit)
- **Offline Queue Pass**: PASS (Verified through manual network toggle; requests flush upon reconnect)
- **Duplicate Submission Pass**: PASS (Idempotency lock prevents double-deduction)

***

*Note: Evidence documentation backing up these E2E passed results (including duplicate-submission resistance testing and payload proof) can be referenced directly in `PHASE1_GATE1_FUNCTIONAL_EVIDENCE.md`.*
