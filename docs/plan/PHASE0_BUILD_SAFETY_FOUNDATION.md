# Phase 0: Build Safety Foundation

## 1. Repo Hygiene
- Enforce strict `package-lock.json` validation.
- Purge any ghost code, testing caches (`__pycache__`), or unauthorized scripts.
- Ensure branch protections block pushes to `main` without PR.

## 2. Environment Handling
- Establish `.env.development` and `.env.production`.
- Implement rigorous checks in Firebase initialization to ensure local dev NEVER accidentally connects to production data.
- Enforce use of Firebase Local Emulator Suite for all local testing.

## 3. Role Routing Skeleton
- Set up React Router with boundary checks matching the `OPS3_BLUEPRINT.html` map.
- Implement the exact `screen_missing` and `screen_noconfig` logic as React Error Boundaries.
- Implement token-based role resolution.

## 4. Security Rules Skeleton
- Deploy `firestore.rules` containing the "deny-by-default" foundational lock.
- Map out scope validators (Role scope matching JWT claims).
- Prevent any delete operations globally (`allow delete: if false;`).

## 5. Immutable Event Model Lock
- Create Firestore architecture where every collection is append-only (`write` = `create` only).
- Disallow updates on financial or inventory logs after creation.
- Set up Firebase Cloud Functions to calculate aggregations strictly from trailing event logs.

## 6. Idempotency Strategy
- Enforce client-generated UUIDv4 `eventId` on all documents.
- Security rule checks `getAfter` to ensure `request.resource.id == eventId`.
- Cloud function interceptors drop duplicate requests if `eventId` already exists.

## 7. Offline Simulation Plan
- Configure Firestore offline persistence (`enableIndexedDbPersistence`).
- Build a dedicated visual "Outbox Queue" monitor to inspect pending writes.
- Test suite specifically to simulate sudden drops in network connectivity during write loops.

## 8. Test Harness Plan
- Implement Playwright E2E testing framework.
- Create automated deterministic invariant tests (e.g., verifying `A - B == C` always holds true on cloud functions).
- Emulate time-travel logic for clock-skew tests.

## 9. Log/Audit Strategy
- Create a `system_audit` collection.
- Route all critical state transitions (session open/close, overrides) to audit logs.
- Include actioning `uid`, `timestamp`, `deviceId`, and before/after context.

## 10. Rollback Strategy
- Due to immutability, rollbacks are implemented as "Contra-Events" (compensating entries).
- Create generic Contra-Event architecture mapping.
- Designate Admin paths for issuing manual contra-events in extreme edge cases.
