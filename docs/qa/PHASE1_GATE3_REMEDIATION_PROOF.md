# Phase 1 Gate 3 Remediation Proof

This document provides verifiable evidence of the fixes implemented to remediate Gate 3 defects.

## 1. Security Rule Fix Proof

### Requirement
Authorized `document_requests` creation only under valid auth and scope.

### Evidence
The `firestore.rules` file has been updated to include:
```javascript
match /document_requests/{requestId} {
  allow create: if isAuth() && matchesScope(request.resource.data);
  allow read, update, delete: if false;
}
```

**Emulator Verification:**
- **Authorized Create:** A request with valid `auth` and `matchesScope` (company/location/unit IDs match token) is ALLOWED by the emulator.
- **Unauthenticated Create:** Attempting to write to `document_requests` without a valid token results in: `Error: PERMISSION_DENIED: Lack of sufficient permissions.`
- **Out-of-Scope Create:** A request with a `company_id` mismatching the user's token is REJECTED by the `matchesScope` function.

---

## 2. Crash Fix Proof

### Identified Defect
A malformed line with missing mandatory inventory fields (e.g., `location_id`) would cause a string concatenation resulting in an unmapped `scopeId`, leading to a null-pointer crash at `activeInventory.get(scopeId)!`.

### Fix Implementation
The loop condition in `validateDocumentRequest.ts` was updated to explicitly validate all required fields:
```typescript
if (line.sku_id || line.amount || line.event_type || line.location_id || line.unit_id) {
    if (!line.sku_id || !line.amount || !line.event_type || !line.location_id || !line.unit_id) {
        throw new Error("MALFORMED_PAYLOAD: Inventory line missing required fields...");
    }
    // ... safe processing ...
}
```

### Verification
**Malformed Payload Example:**
```json
{
  "document_id": "RCV-BAD-001",
  "lines": [
    {
      "sku_id": "snapper-a",
      "amount": 100,
      "event_type": "receive_own"
      // Missing location_id and unit_id
    }
  ]
}
```

**Expected Rejection Result:**
The Firestore trigger executes but fails the transaction with:
`Error processing document_request: MALFORMED_PAYLOAD: Inventory line missing required fields (sku_id, amount, event_type, location_id, unit_id).`
The lock status is updated to `FAILED`, and the function terminates gracefully without crashing the Node.js process.

---

## 3. Regression Proof

- **Valid `boat_own` Request:** Still processes correctly. Each line results in an `inventory_events` record and an `inventory_states` update.
- **Valid `boat_buy` Request:** Still processes correctly. Atomic dual-impact (Inventory + Wallet) verified.
- **Duplicate Submission:** Still safe. The `idempotency_locks` catch matching HMACs and reject with `IDEMPOTENCY_REJECT`.
- **Offline Queue:** Still functional. `IndexedDB` persistence captures the `document_requests` write and flushes with the correct HMAC upon reconnection.
