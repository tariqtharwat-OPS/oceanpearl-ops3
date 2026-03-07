# Phase 1 Boat Implementation Log

## Commits & Details

### [Draft] Phase 1 Gate 1: preflight cleanup + boat session start/open
- **What changed:** 
  - Added `BoatOperatorLayout.tsx` and updated `App.tsx` routing.
  - Implemented `/app/boat/start` (`TripStart.tsx` matching `boat_start` blueprint).
  - Implemented `/app/boat/init` (`OpeningBalances.tsx` matching `boat_init` blueprint).
  - Documented Preflight cleanup notes in `PHASE1_PREFLIGHT_CLEANUP.md`.
- **Why:** 
  - Fulfilling the explicit Boat phase boundary MVP.
  - Securing matching interface rules extracted verbatim from `build_boat.py`.
- **Test evidence:** 
  - Successfully mapped `/app/boat/*` routes inside `<RoleBasedRouter>` to catch the `boat_operator` claim cleanly.

### [Fix] Phase 1 Gate 1 Remediation: Functional Write Path & Offline Mutation
- **What changed:**
  - Mutation service created (`frontend/src/services/firestoreWriterService.ts`).
  - Screens connected (`TripStart.tsx` and `OpeningBalances.tsx` actively generate frontend events instead of stubbing).
  - Functional write path completed (generates SHA-256 idempotency key via `HMAC(secret, payload_hash + nonce)`, writes to `wallet_event_requests`).
  - Emulator verification complete (Validated Gate 1 successfully passes validation pipeline directly into `wallet_events` history).
- **Why:**
  - Required offline support and strict phase-boundary enforcement against the Phase 0 backend security model. Gate 1 failed previously because backend writes were mocked.
- **Test evidence:**
  - Full evidence map including Offline and Duplicate-submission resistance uploaded to `docs/qa/PHASE1_GATE1_FUNCTIONAL_EVIDENCE.md`.

### Phase 1 Gate 2: Boat Expense Document + Wallet Event Integration
- **What changed:**
  - Implemented `TripExpenses.tsx` (`boat_exp`) matching the frozen UI blueprint for multi-line expense invoices.
  - Created `validateDocumentRequest.ts` Cloud Function triggered by `document_requests/{requestId}` inbox.
  - Extended `firestoreWriterService.ts` with `writeDocumentRequest()` method for the `document_requests` collection.
  - Wired `TripExpenses` into `BoatOperatorLayout.tsx` at `/app/boat/expenses`.
  - Added explicit `case "trip_start"` inside `validateWalletEvent.ts` delta switch.
  - Enabled `enableIndexedDbPersistence(db)` in `firebase.ts` for explicit offline support.
  - Exported `validateDocumentRequest` from `functions/src/index.ts`.
- **Design decisions:**
  - **Document-centric write pattern:** Expense invoices are submitted as a single monolithic payload to `document_requests` containing an array of `lines`. The backend function pre-fetches all referenced wallets before writes to avoid Firestore transaction read-after-write violations, then bulk-updates wallet states in a single pass.
  - **Synthesized wallet events:** Each line in the document generates a child `wallet_events` record with ID `{documentHmac}_L{index}`, linking back to the parent document via `parent_document_id`.
  - **Document state machine:** Documents transition `draft → submitted → posted`. Once posted (server-side), the document record is immutable and wallet events are generated atomically.
  - **Offline persistence:** `enableIndexedDbPersistence` ensures Firestore caches writes locally. HMAC is computed at click-time (not sync-time), so offline payloads are identical to online ones.
- **Test evidence:**
  - All tests documented in `docs/qa/PHASE1_BOAT_TEST_RESULTS.md` under Gate 2 section.

### Phase 1 Gate 3: Fish Receiving + Inventory Event Integration
- **What changed:**
  - Implemented `OwnCatch.tsx` (`boat_own`) using `inventory_event_requests` for direct weight onboarding.
  - Implemented `BuyCatch.tsx` (`boat_buy`) using `document_requests` for complex multi-impact fish purchasing.
  - Updated `validateDocumentRequest.ts` backend to support inventory impact:
    - Added pre-fetching for `inventory_states`.
    - Added logic to generate `inventory_events` for SKU lines.
    - Supported simultaneous wallet and inventory impact (Cash purchase vs AP purchase logic).
  - Wired routes in `BoatOperatorLayout.tsx`.
- **Inventory architecture decisions:**
  - **Deterministic Sequencing:** Every inventory event (whether from a direct request or a parent document) increments a sequence number in an `inventory_state` doc scoped by `location_id__unit_id__sku_id`. Transactions ensure no two updates can race for the same number.
  - **Single vs Multi Row:** Direct `boat_own` sends individual events to the `inventory_event_requests` inbox, while `boat_buy` uses the `document_requests` pipeline for atomicity between weight gain and wallet deduction.
  - **Event ID Synthesis:** Inventory events generated from documents use the ID `{documentHmac}_L{index}_I` to ensure global uniqueness and traceability back to the source document.
- **Test verification:**
  - Validated inventory balance updates in Firestore Emulator.
  - Validated settlement method logic: 'cash' triggers a parallel wallet event, 'ap' only triggers the inventory event (leaving the document as the source for future AP settling).
  - Verified offline behavior via local persistence flushing.
