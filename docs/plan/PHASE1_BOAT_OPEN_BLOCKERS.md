# Phase 1 Boat MVP Blockers

## Open Issues

### 1. IndexedDB Wrapper Service Hook
- **Severity**: MEDIUM
- **Blocks Continuation?**: NO.
- **Description**: The frontend requires a generic caching or mutation service block bridging React state explicitly to the `firebase/firestore` API endpoints designed for offline mutation. Currently `firestoreService.ts` focuses primarily on the `v3_*` read structures. For Gate 2, the `useWalletWriter(hmacPayload)` standard must be architected in the UI.

### 2. ID Generation For Offline Docs
- **Severity**: LOW
- **Blocks Continuation?**: NO.
- **Description**: To ensure offline safety, `TRIP-AUTO` IDs will need a mathematical offline UUID or structured format `TRIP-B1-{MMDDYYYY}-{hash}`. Currently hardcoded to `TRIP-AUTO` per blueprint. Wait for UX approval on suffix generation schema.
