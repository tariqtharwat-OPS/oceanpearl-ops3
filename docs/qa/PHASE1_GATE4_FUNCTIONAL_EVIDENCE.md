# Phase 1 Gate 4 Functional Evidence: Boat Sales

This document provides evidence of the Boat Sales implementation, covering atomic inventory and financial impacts.

## 1. Cash Sale Example

### Request Payload (`document_requests`)
```json
{
  "document_id": "INV-B1-SALE-0226",
  "document_type": "sale_invoice",
  "payment_method": "cash",
  "total_amount": 2000000,
  "lines": [
    {
      "sku_id": "snapper-grade-a",
      "amount": 20,
      "event_type": "sale_out",
      "location_id": "Kaimana-Hub",
      "unit_id": "Boat-Faris",
      "wallet_id": "TRIP-WALLET-B1",
      "payment_amount": 2000000,
      "payment_event_type": "revenue_cash"
    }
  ]
}
```

### Direct Impact Analysis (Atomic Transaction)
1. **Document Created**: Record in `documents` collection with status `posted`.
2. **Inventory Impact**:
   - New `inventory_events` record: `..._L0_I` with `event_type: sale_out`, `amount: 20`, `sequence_number: N+1`.
   - `inventory_states` for `Kaimana-Hub__Boat-Faris__snapper-grade-a` balance decreases by 20kg.
3. **Wallet Impact**:
   - New `wallet_events` record: `..._L0_W` with `event_type: revenue_cash`, `amount: 2000000`, `sequence_number: M+1`.
   - `wallet_states` for `TRIP-WALLET-B1` balance increases by 2,000,000.

---

## 2. Receivable Sale Example

### Request Payload (`document_requests`)
```json
{
  "document_id": "INV-B1-SALE-REC-001",
  "document_type": "sale_invoice",
  "payment_method": "receivable",
  "total_amount": 5000000,
  "lines": [
    {
      "sku_id": "grouper-live",
      "amount": 50,
      "event_type": "sale_out",
      "location_id": "Kaimana-Hub",
      "unit_id": "Boat-Faris"
      // No wallet_id, payment_amount, or payment_event_type
    }
  ]
}
```

### Result Analysis
- **Inventory Decreases**: Verified `inventory_events` created for `sale_out`.
- **Wallet Unchanged**: No `wallet_events` created because `wallet_id` was omitted in the payload.
- **Receivable Preservation**: The `documents` record preserves `payment_method: receivable`, which allows Hub Finance to track this as an outstanding AR.

---

## 3. Duplicate Submission Example
- **Action**: User clicks "Post" twice rapidly while online.
- **Mechanism**: Both requests share the same HMAC-based `idempotency_key`.
- **Result**:
  - Request 1 is processed; lock status set to `COMPLETED`.
  - Request 2 is rejected by `validateDocumentRequest` with `IDEMPOTENCY_REJECT: Document already processed.`
  - **Stock Integrity**: Inventory is ONLY deducted once.

---

## 4. Offline Queue Example
- **Action**: User records a sale while in a "dead zone" (mobile disconnected).
- **Mechanism**: `firestoreWriterService.writeDocumentRequest` writes to the local `IndexedDB`.
- **Status**: UI shows "Loading..." or "Queued".
- **Reconnect**: Once network returns, Firebase flushes the `document_requests` write.
- **Verification**: The backend processes the request normally; inventory and wallet updates are applied accurately.
