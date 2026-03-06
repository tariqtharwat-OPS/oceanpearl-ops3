# OPS3 Pre-Implementation Readiness Checklist

## Phase 0 Safety Verification
- [ ] Strictly Monotonic `seq_num` logic defined in Cloud Functions.
  - Verified by:
  - Date:
- [ ] `eventId = HMAC(...)` Idempotency logic implemented on Client.
  - Verified by:
  - Date:
- [ ] Immutable Ledger collections explicitly deny `.update()` and `.delete()` in Firestore rules.
  - Verified by:
  - Date:

## Phase 0.5 Chaos Preparation
- [ ] Staging environment securely isolated from production.
  - Verified by:
  - Date:
- [ ] Emulator test harness capable of simulating offline IndexedDB migration.
  - Verified by:
  - Date:
- [ ] All 6 synthetic Chaos Test Fixtures implemented in E2E suite.
  - Verified by:
  - Date:

## Security Validation
- [ ] Compound JWT Scopes map matching (`company`, `location`, `unit`).
  - Verified by:
  - Date:
- [ ] Two-phase transfer destination explicitly requires destination Auth token.
  - Verified by:
  - Date:
- [ ] Shark AI proxy stripped of global read permissions.
  - Verified by:
  - Date:

## Developer Environment
- [ ] Local `npm run emulator:start` script documented and functional.
  - Verified by:
  - Date:
- [ ] Developers trained on `serverTimestamp()` usage vs `recordedAt`.
  - Verified by:
  - Date:

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
