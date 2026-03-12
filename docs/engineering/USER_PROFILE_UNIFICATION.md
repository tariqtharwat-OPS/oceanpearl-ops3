## Engineering Log: User Profile Unification

**Date:** 2026-03-12

### 1. Problem Statement

A codebase audit revealed two sources of truth for user profiles:

1.  **`v3_users` (Canonical):** Used by the frontend `AuthContext`, `firestoreService`, and all backend modules via the `auth.js` helper library. This collection uses a schema with `allowedLocationIds` and `allowedUnitIds` arrays for scope validation.
2.  **`users` (Legacy):** Used only by the `wipStates.js` module. This collection contained a denormalized schema with single `location_id` and `unit_id` string fields.

This duality caused data inconsistency, required test scripts to perform complex dual-seeding, and created a potential for subtle permission bugs, as a user's scope could differ between modules.

### 2. Resolution

The `users` collection has been deprecated and removed. All modules now rely exclusively on the `v3_users` collection as the single source of truth for user profiles.

**Key Changes:**

1.  **`wipStates.js` Refactor:**
    *   Removed the local `getUserProfile` function that read from the legacy `users` collection.
    *   Updated all internal functions (`createWipState`, `advanceWipStage`, etc.) to use the canonical `requirePermissions` helper from `auth.js`.
    *   Scope validation logic was updated to check against the `allowedLocationIds` and `allowedUnitIds` arrays from the `v3_users` profile, replacing the direct `user.location_id` checks.

2.  **Test Script Unification:**
    *   All test scripts (`test_p2s3_wip_processing.js`, `test_p3_e2e_operational.js`, `test_p33_operational_simulation.js`) were modified.
    *   Removed all code related to seeding and cleaning up the legacy `users` collection.
    *   User seeding functions were updated to create profiles only in the `v3_users` collection, using the canonical schema with `allowedLocationIds` and `allowedUnitIds`.

### 3. Verification

A full regression suite was executed after the refactoring to ensure no functionality was broken. All tests passed, confirming that the unification was successful and the system remains stable.

*   **Phase 2 - WIP Processing Test:** 38/38 Assertions Passed ✅
*   **Phase 2 - Hub Receiving Test:** 44/44 Assertions Passed ✅
*   **Phase 3 - E2E Operational Test:** 62/62 Assertions Passed ✅
*   **Phase 3.3 - Operational Simulation Test:** 66/66 Assertions Passed ✅

This change simplifies the architecture, eliminates a source of data inconsistency, and strengthens the integrity of the role-based access control system.
