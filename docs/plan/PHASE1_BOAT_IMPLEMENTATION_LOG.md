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
