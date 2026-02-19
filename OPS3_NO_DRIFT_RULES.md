# OPS3 Anti-Drift Governance Rules

To prevent regressions and maintain the CEO-approved Milestone 3 state, the following rules are ENFORCED:

## 1. Boundary Enforcement
- **ALLOWED MODIFICATIONS**: Files within `frontend/**` are open for development.
- **FORBIDDEN (FROZEN)**: Do NOT modify the following without explicit approval:
  - `functions/**` (Cloud Functions)
  - `firestore.rules` (Security Rules)
  - `firestore.indexes.json` (Database Indexes)
  - `storage.rules` (Storage Rules)
  - `lib/**` (Shared libraries)

## 2. Invariant Code Patterns
- **Base Path**: `frontend/vite.config.ts` MUST contain `base: "/app/"`.
- **Asset Loading**: All assets (logos, images) MUST be referenced via `BASE_URL`:
  `const url = \${import.meta.env.BASE_URL}assets/logo.png;`
- **NO ABSOLUTE PATHS**: Avoid `/assets/` or `/logo.png`. Use the `BASE_URL` pattern.

## 3. Verification GATES
- Before every commit/deploy, run: `powershell ./frontend/scripts/verify.ps1`
- Any failure in **Build**, **Typecheck**, or **Lint** blocks the push.

## 4. Environment
- Use `useEmulator` logic in `firebase.ts` to ensure `development` mode connects to local emulators and `production` connects to the real Cloud project.

---
*Locked by Antigravity - 2026-02-19*
