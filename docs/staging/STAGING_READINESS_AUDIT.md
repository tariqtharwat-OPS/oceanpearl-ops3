## OPS3 Staging Readiness Audit Report

**Date:** 2026-03-12
**Auditor:** Manus AI

This audit identifies critical blockers and security risks that must be addressed before deploying the OPS3 system to a staging or production environment. All findings are based on a full-code review of the `frontend` and `functions` directories.

### Executive Summary

| Category                  | Finding                                                                 | Status      | Severity |
| ------------------------- | ----------------------------------------------------------------------- | ----------- | -------- |
| **User Management**       | `admin_createUser` callable function is missing                         | **BLOCKER** | CRITICAL |
| **User Management**       | Admin panel cannot list users due to Firestore rules                    | **BLOCKER** | CRITICAL |
| **Frontend**              | Hardcoded `localhost` URL in public Traceability page                   | **BLOCKER** | CRITICAL |
| **Security**              | Hardcoded HMAC secret in frontend `ops3Service.ts`                      | **RISK**    | HIGH     |
| **User Profile**          | Dual `users` / `v3_users` collections with different schemas            | **FIXED**   | HIGH     |

### Staging Blockers (Must Fix)

1.  **`admin_createUser` Callable Function is Missing**

    -   **Description:** The frontend Admin Panel at `/app/admin/users` calls a Cloud Function named `admin_createUser` to create new user accounts. This function is not defined or exported in `functions/index.js`, which will cause all user creation attempts from the admin panel to fail in a deployed environment.
    -   **Resolution:** A new callable function, `admin/v3AdminCreateUser.js`, has been created and exported from `index.js`. This function handles user creation, role assignment, and profile document creation in `v3_users`.

2.  **Admin Panel Cannot List Users**

    -   **Description:** The Admin Panel attempts to list all user profiles by querying the `v3_users` collection directly. The existing Firestore security rules (`allow read: if request.auth.uid == userId`) only permit users to read their own profile document. This prevents the admin panel from displaying the user list.
    -   **Resolution:** The `firestore.rules` have been updated to allow users with `admin` or `ceo` roles to read all documents in the `v3_users` collection, enabling the user management list.

3.  **Hardcoded `localhost` URL in Traceability Page**

    -   **Description:** The public-facing traceability page at `/traceability` contains a hardcoded `fetch` request to `http://127.0.0.1:5001/...` for verifying batch IDs. This will fail in any non-local environment.
    -   **Resolution:** The `fetch` request in `Traceability.tsx` has been updated to be environment-aware. It now uses the emulator URL for local development and the production Cloud Functions URL (`https://asia-southeast1-PROJECT_ID.cloudfunctions.net/...`) for staging/production.

### High-Risk Findings (Recommended Fix)

1.  **Hardcoded HMAC Secret in Frontend**

    -   **Description:** The `ops3Service.ts` file contains a hardcoded HMAC secret (`OPS3_PHASE0_DEV_SECRET`). This secret is used to sign `document_request` payloads from the client-side (e.g., for `inventory_transformation`). While the backend re-validates this HMAC, exposing a secret in client-side code is a significant security risk.
    -   **Resolution:** The code has been updated to read the secret from a Vite environment variable (`import.meta.env.VITE_HMAC_SECRET`), with a fallback to the development secret for local emulator use. **A staging deployment checklist item has been added to ensure this environment variable is set securely in the production environment.**

### Completed Fixes

1.  **Unified User Profile Source (`v3_users`)**

    -   **Description:** The codebase previously used two separate Firestore collections for user profiles: `users` (legacy, used only by `wipStates.js`) and `v3_users` (canonical, used by all other modules and the frontend). This created data duplication and inconsistent schemas.
    -   **Resolution:** The `wipStates.js` module has been refactored to use the canonical `auth.js` `getUserProfile` function, which reads from `v3_users`. All test scripts have been updated to seed and clean up only the `v3_users` collection, removing the legacy `users` collection entirely.
