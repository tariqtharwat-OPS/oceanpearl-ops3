# Phase 1 Boat MVP Blockers

## Resolved Issues

### 1. IndexedDB Wrapper Service Hook / Frontend Mutation Service
- **Severity**: CRITICAL
- **Blocks Continuation?**: CLOSED
- **Root Cause**: The frontend was missing a generic caching or mutation service block bridging React state explicitly to the `firebase/firestore` API endpoints designed for offline mutation. Writes were hardcoded or stubbed visually without dispatching into the `wallet_event_requests` or `inventory_event_requests` inbox.
- **Fix Applied**: Built `firestoreWriterService.ts` to explicitly serialize payloads, generate nonces, compute SHA-256 payload hashes, and sign payloads with an HMAC secret `eventId = HMAC(secret, payload_hash + nonce)`. Then, wired `TripStart.tsx` and `OpeningBalances.tsx` to this real mutation hook, pushing events directly into the secured emulator inbox.
- **Verification Evidence**: See `docs/qa/PHASE1_GATE1_FUNCTIONAL_EVIDENCE.md` outlining the precise payload generation, queue acceptance, duplicate handling, and offline flush queue results.

### 2. ID Generation For Offline Docs
- **Severity**: LOW
- **Blocks Continuation?**: NO
- **Description**: To ensure offline safety, `TRIP-AUTO` IDs will need a mathematical offline UUID or structured format `TRIP-B1-{MMDDYYYY}-{hash}`. Currently hardcoded to `TRIP-AUTO` per blueprint. Wait for UX approval on suffix generation schema.
