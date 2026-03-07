# Phase 1 Boat Implementation Log

This log tracks the engineering decisions, changes, and verification milestones for the Boat Operator MVP.

## Commits & Details

### Phase 1 Gate 1: Session Start & Opening Balances
- **What changed:** Initial routing, `boat_start` and `boat_init` screens.
- **Remediation:** Added `firestoreWriterService.ts` for functional HMAC-signed writes; removed mocked backend paths.

### Phase 1 Gate 2: Trip Expenses
- **What changed:** `boat_exp` screen implementing multi-line expense documents.
- **Backend:** Created `validateDocumentRequest.ts` and `document_requests` inbox.
- **Design:** Adopted document-centric atomic transactions for ledger safety.

### Phase 1 Gate 3: Fish Receiving
- **What changed:** `boat_own` (Inventory only) and `boat_buy` (Inventory + Cash/AP).
- **Remediation:** Fixed `firestore.rules` for `document_requests` and added `MALFORMED_PAYLOAD` guards in Cloud Functions.

### Phase 1 Gate 4: Boat Sales + Atomic Inventory/Financial Integration
- **What changed:** 
  - Implemented `BoatSale.tsx` (`boat_sale`) with dynamic SKU selection and payment method logic.
  - Linked sales to the `document_requests` pipeline.
- **Design Decisions:**
  - **Emerald Design Integration:** Applied the Emerald theme specifically to sales to differentiate from Expenses (Slate) and Receiving (Indigo/Teal).
  - **Dual-Mode Revenue:** Implemented "Cash" (immediate wallet credit) and "Receivable" (document-only intent). Receivable mode intentionally omits wallet fields to avoid false cash inflation.
  - **Inventory Invariants:** Sale lines trigger `sale_out` events. The backend enforces `STOCK_DEFICIT` checks to prevent selling more than is physically onboarded.
- **Test Evidence:**
  - Verified atomic weight deduction and cash increment in `PHASE1_GATE4_FUNCTIONAL_EVIDENCE.md`.
- **Blockers:** None.

### Phase 1 Gate 5: Trip Closure + Remittance + Settlement Locking
- **What changed:**
  - Implemented `TripClosure.tsx` (`boat_close`) featuring aggregate trip summaries and crew settlement tables.
  - Registered the component in `BoatOperatorLayout.tsx`.
- **Engineering Highlights:**
  - **Immutability Engine:** Added pre-transaction status checks to all Boat-related Cloud Functions (`validateDocumentRequest`, `validateWalletEvent`, `validateTransferEvent`). If `trip_states/{tripId}` is "closed", all writes are rejected.
  - **Automatic Remittance:** The `trip_closure` document logic triggers `transfer_initiated` events for BOTH cash (wallet) and fish (inventory), effectively clearing the boat's local ledger and moving assets to the Hub.
  - **Digital Attestation:** The "Lock Trip" action represents a high-integrity signature (HMAC) that seals the trip against post-hoc edits.
- **Verification:**
  - Detailed evidence of closure, remittance, and post-closure rejection documented in `PHASE1_GATE5_FUNCTIONAL_EVIDENCE.md`.
  - Offline-to-Online flush verified using IndexedDB persistence logs.
- **Blockers:** None in implementation. (Future phases will refine the AR ledgering of non-cash sales).
