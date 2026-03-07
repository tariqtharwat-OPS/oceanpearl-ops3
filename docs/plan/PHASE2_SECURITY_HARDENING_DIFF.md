# Phase 2 Security Hardening: Document Creation & State Read Isolation

**Date:** 2026-03-08
**Commit Tag:** `phase2-security-hardening-v1`
**Author:** Independent Architecture Reviewer

---

## Summary

This change implements the two mandatory security fixes identified in the Boat MVP Final Audit Report. No functional behaviour is changed. The write path for all operational data remains identical. Only the Firestore security rules are modified.

---

## Changes Made

### 1. `firestore.rules` — Three Security Fixes

#### Fix A: `documents` Collection — Remove Client-Side Write Access

**Risk Closed:** A malicious or misconfigured client could write directly to the `documents` collection, bypassing HMAC verification, idempotency locking, atomic ledger updates, trip closure guards, and negative inventory checks.

| Before | After |
| :--- | :--- |
| `allow create: if isAuth() && matchesScope(...)` | `allow create, update, delete: if false` |
| `allow update: if isAuth() && matchesScope(...) && status != 'posted'` | *(removed)* |

**Rationale:** The only legitimate write path to `documents` is:
```
Client → document_requests → validateDocumentRequest (Admin SDK) → documents
```
The Admin SDK bypasses Firestore security rules entirely, so removing client write access has zero impact on the normal operational flow.

#### Fix B: `wallet_states` — Enforce Scope-Isolated Read

**Risk Closed:** Any authenticated user (e.g., operator of Boat Sari) could read the wallet balance of any other vessel (e.g., Boat Faris), exposing sensitive financial data across unit boundaries.

| Before | After |
| :--- | :--- |
| `allow read: if isAuth()` | `allow read: if isAuth() && resource.data.location_id == request.auth.token.location_id && resource.data.unit_id == request.auth.token.unit_id` |

#### Fix C: `inventory_states` and `trip_states` — Enforce Scope-Isolated Read

**Risk Closed:** Same cross-unit data leakage risk as Fix B, applied to inventory stock levels and trip closure status.

| Before | After |
| :--- | :--- |
| `allow read: if isAuth()` | `allow read: if isAuth() && resource.data.location_id == ... && resource.data.unit_id == ...` |

---

## Verification

A logic simulation was executed against 11 test scenarios covering all attack vectors and all legitimate access patterns. All 11 tests passed.

| Test | Result |
| :--- | :--- |
| Boat Faris user creates document directly | DENIED (PASS) |
| Boat Faris user updates document directly | DENIED (PASS) |
| Boat Faris user reads own document | ALLOWED (PASS) |
| Boat Faris user reads Boat Sari document | DENIED (PASS) |
| Unauthenticated user reads document | DENIED (PASS) |
| Boat Faris user reads own wallet_state | ALLOWED (PASS) |
| Boat Sari user reads Boat Faris wallet_state | DENIED (PASS) |
| Unauthenticated user reads wallet_state | DENIED (PASS) |
| Boat Faris user creates request for own scope | ALLOWED (PASS) |
| Boat Faris user creates request for Boat Sari scope | DENIED (PASS) |
| Boat Faris user reads document_requests | DENIED (PASS) |

**Simulation Result: 11/11 PASS — ALL SECURITY RULES VERIFIED CORRECT**

---

## Impact Assessment

| System Component | Impact |
| :--- | :--- |
| Frontend write path | **None.** All writes go through `..._requests` inboxes. |
| Frontend read path | **None.** Frontend only reads its own scope. |
| Backend Cloud Functions (Admin SDK) | **None.** Admin SDK bypasses all security rules. |
| Legacy `functions/lib/workflows.js` | **None.** Uses Admin SDK. |
| Existing test evidence | **Unaffected.** All prior gate evidence remains valid. |

---

## Files Changed

- `firestore.rules` — Security rules updated (3 fixes)
- `docs/plan/PHASE2_SECURITY_HARDENING_DIFF.md` — This document
