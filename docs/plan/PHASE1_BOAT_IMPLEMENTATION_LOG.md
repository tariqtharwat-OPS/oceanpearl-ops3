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
