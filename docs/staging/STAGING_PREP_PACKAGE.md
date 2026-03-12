## OPS3 Staging Prep Package

**Date:** 2026-03-12

This document contains all assets and instructions required to prepare the OPS3 system for a staging deployment.

### 1. Staging Environment Variables

The following environment variables must be set in the staging environment's configuration (e.g., `.env.production` for the frontend, Firebase Function secrets for the backend).

**Frontend (`.env.production`):**

```
# Firebase Production Configuration
VITE_FIREBASE_API_KEY=AIzaSyBmHSr7huWpMZa9RnKNBgV6fnXltmvsxcc
VITE_FIREBASE_AUTH_DOMAIN=oceanpearl-ops.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=oceanpearl-ops
VITE_FIREBASE_STORAGE_BUCKET=oceanpearl-ops.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=784571080866
VITE_FIREBASE_APP_ID=1:784571080866:web:61bacaf38ea90f81d1f7fb

# CRITICAL: This HMAC secret must match the backend secret
VITE_HMAC_SECRET="<YOUR_STAGING_HMAC_SECRET>"
```

**Backend (Firebase Function Secrets):**

Set these secrets using the `firebase functions:secrets:set` command:

```bash
firebase functions:secrets:set HMAC_SECRET
# Follow prompts to enter the secret value

firebase functions:secrets:set COMMIT_HASH
# Follow prompts to enter the latest git commit hash
```

### 2. One-Time Bootstrap Procedure

After the initial deployment, the system must be bootstrapped to create the first administrative user and seed default configuration.

1.  **Trigger the `v3Bootstrap` function:** This is a callable function that requires a secret key.

    *   **Function Name:** `v3Bootstrap`
    *   **Region:** `asia-southeast1`
    *   **Payload:**

        ```json
        {
            "secret": "OceanPearl2026Bootstrap!"
        }
        ```

2.  **Verification:** Upon successful execution, the following will be created:
    *   An authentication user with email `ceo@oceanpearlseafood.com`.
    *   A `v3_users` profile for this user with the `admin` role.
    *   A `v3_system/bootstrap` document marking the process as complete.
    *   Default system configuration documents in `control_config`.

### 3. Hardened Source Code Files

The following files have been created or modified to address staging-readiness issues. They are included in the latest commit and ready for deployment.

| File Path                                                   | Description                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `functions/admin/v3AdminCreateUser.js`                      | **NEW:** Callable function for admin panel to create new users.                                         |
| `functions/index.js`                                        | **MODIFIED:** Exported the new `admin_createUser` function.                                               |
| `functions/lib/wipStates.js`                                | **MODIFIED:** Refactored to use canonical `v3_users` profile source.                                      |
| `firestore.rules`                                           | **MODIFIED:** Updated rules to allow `admin`/`ceo` to list all users in `v3_users`.                       |
| `frontend/src/pages/Traceability.tsx`                       | **MODIFIED:** Replaced hardcoded `localhost` URL with an environment-aware production URL.                |
| `frontend/src/services/ops3Service.ts`                      | **MODIFIED:** Replaced hardcoded HMAC secret with an environment variable (`VITE_HMAC_SECRET`).           |
| `scripts/test_p2s3_wip_processing.js`                       | **MODIFIED:** Updated test to seed and clean up only the canonical `v3_users` collection.                 |
| `scripts/test_p3_e2e_operational.js`                        | **MODIFIED:** Updated test to seed and clean up only the canonical `v3_users` collection.                 |
| `scripts/test_p33_operational_simulation.js`                | **MODIFIED:** Updated test to remove dual-seeding and use only the canonical `v3_users` collection.       |
