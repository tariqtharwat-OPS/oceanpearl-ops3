# Phase 1 Preflight Cleanup

## 1. Legacy Collection Cleanup Plan
During the Phase 0 Remediation, the `v3_*` collections were actively removed and isolated from the core operations. The remaining `v3_*` references identified via codebase search exist strictly within deprecated audit scripts, legacy deployment snapshots, and old test scaffolding. 

**Remaining Classifications:**
- `v3_partners`: **Safe to defer**. This is a static reference table for master data. It will be natively renamed to `partners` in Phase 2 Hub/Factory implementation. Since the Boat MVP does not perform central vendor management, deferral prevents unnecessary context shift. 
- `v3_products`: **Safe to defer**. Same as above, static lookup. Will translate to `sku_catalog` or `products` when multi-unit processing is activated.
- `v3_ledger_entries`, `v3_inventory_valuations`, `v3_batches`: **Deprecated/Resolved**. Successfully translated to `wallet_events`, `inventory_events`, and `documents` respectively inside the active active Phase 0 ruleset and Cloud Functions.
- `v3_shark_*`: **Deprecated/Resolved**. Replaced entirely by the standard `audit_logs` mechanics. 

*Conclusion:* No active backend logic currently relies on legacy naming conventions. The foundation is sanitized.

## 2. Idempotency Timestamp Improvement Note
The idempotency lock engine currently uses `Date.now()` implemented firmly inside the Cloud Function (`functions/src/validateWalletEvent.ts`):
```typescript
const elapsed = Date.now() - lockData.timestamp;
```
**Decision:** This remains **acceptable for the current phase.** 
*Reasoning:* Using Firebase `serverTimestamp()` resolves asynchronously and requires a secondary database read-back to evaluate arithmetic diffs for the 60,000ms stale-lock TTL window. Because `Date.now()` is mathematically executed on the isolated Google Cloud Function instance acting as the backend server (not the untrusted offline client device), it functionally acts as a secure surrogate for `serverTimestamp()` during ephemeral, high-speed timeout calculations. The permanent underlying ledger safely retains `serverTimestamp()` for absolute accounting. 

## 3. Documentation Correction
The initial `PHASE0_REMEDIATION_DIFF.txt` generated during the verification phase mismatch was caused by attempting to diff against `HEAD` before changes were explicitly added to the Git index boundary. This was corrected in the Phase-0 wrap-up, and the canonical diff successfully maps all architectural collection shifts directly to the immutable UI contract. The `docs/plan/PHASE0_IMPLEMENTATION_DIFF.txt` file acts as the primary source of truth for the remediation logic.
