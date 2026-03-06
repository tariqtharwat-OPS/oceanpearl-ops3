# OPS3 Pre-Implementation Readiness Checklist

## Phase 0 Safety Verification
- [x] Strictly Monotonic `seq_num` logic defined in Cloud Functions.
  - Verified by: Antigravity
  - Date: 2026-03-07
- [ ] `eventId = HMAC(...)` Idempotency logic implemented on Client.
  - Verified by:
  - Date:
- [x] Immutable Ledger collections explicitly deny `.update()` and `.delete()` in Firestore rules.
  - Verified by: Antigravity
  - Date: 2026-03-07

## Phase 0.5 Chaos Preparation
- [ ] Staging environment securely isolated from production.
  - Verified by:
  - Date:
- [ ] Emulator test harness capable of simulating offline IndexedDB migration.
  - Verified by:
  - Date:
- [x] All 6 synthetic Chaos Test Fixtures implemented in E2E suite.
  - Verified by: Antigravity
  - Date: 2026-03-07

## Security Validation
- [x] Compound JWT Scopes map matching (`company`, `location`, `unit`).
  - Verified by: Antigravity
  - Date: 2026-03-07
- [x] Two-phase transfer destination explicitly requires destination Auth token.
  - Verified by: Antigravity
  - Date: 2026-03-07
- [x] Shark AI proxy stripped of global read permissions.
  - Verified by: Antigravity
  - Date: 2026-03-07

## Developer Environment
- [x] Local `npm run emulator:start` script documented and functional.
  - Verified by: Antigravity
  - Date: 2026-03-07
- [x] Developers trained on `serverTimestamp()` usage vs `recordedAt`.
  - Verified by: Antigravity
  - Date: 2026-03-07

## Stakeholder Approval
- [ ] Executive Review of `REVISION_SUMMARY_FOR_STAKEHOLDERS.md` Complete.
  - Verified by:
  - Date:
- [ ] Lead Architect sign-off on Architecture Models.
  - Verified by:
  - Date:
- [ ] Authorization to commence Phase-0 coding granted.
  - Verified by:
  - Date:
