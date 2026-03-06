# OPS3 Developer Handbook — Phase 0 & 0.5 Implementation

## Quick Start
1. **Running Firebase Emulator:**
   - Execute `npm run emulator:start` to boot the local suite (Firestore, Auth, Functions).
   - Ensure you are bound to `127.0.0.1:8080` (Firestore) to prevent accidental cloud connects.
2. **Seeding Test Data:**
   - Run `node scripts/seed_phase0.js` to inject test tenant boundaries (`companyId`, `locationId`) and test Auth tokens.
3. **Enabling Offline Mode:**
   - In your React app entry point, `enableIndexedDbPersistence()` must be toggled for staging builds.
4. **Triggering Chaos Simulations:**
   - Drop the emulator socket briefly via `npm run emulator:kill-network` to test partial-sync batch holds.

## Key Architecture Decisions

### Server-Sequence Ordering
- *What:* The server assigns a `seq_num` to every ledger write via a Cloud Function trigger (`onCreate`).
- *Why:* Client timestamps (`recordedAt`) are untrusted because a device clock can easily be skewed to bypass deadlines. Using a monotonic `seq_num` enables deterministic aggregation without race conditions.

### HMAC Idempotency Keys
- *What:* Every write request MUST have its document ID generated as `eventId = HMAC(secret, payload_hash + nonce)`.
- *Why:* Pure UUIDs can be manipulated by malicious clients to forge fake retries. Binding the ID to the payload hash structurally aborts tampered replays.

### Two-Phase Transfer Model
- *What:* Moving physical assets/cash forces a `transfer_initiated` -> `transfer_received` state.
- *Why:* It maps strictly to physical reality. If a boat claims it gave 50kg to a factory, the factory's inventory DOES NOT increase until the factory's device explicitly countersigns receipt.

## Common Pitfalls
1. **Never trust client timestamps:** Do not use `recordedAt` for state ordering. Only use it for UI reference points. Use `request.time` (serverTimestamp).
2. **Never modify immutable ledger entries:** Do not execute `.update()` on an `InventoryEvent` or `WalletEvent`. If a mistake was made, issue a contra-event.
3. **Never void documents without dependency checks:** If document A was voided, but document B relied on A's outputs, the ledger will fracture. Check dependents first.

## Testing Checklist
Verify these prior to escalating a PR:
- [ ] Offline conflict matrix scenarios trigger intended Cloud Function rejection paths.
- [ ] Wallet balances recover accurately after queue flushes.
- [ ] Attempting to write a document with a mismatched `locationId` fails `PERMISSION_DENIED`.
- [ ] Print templates generate QR validation signatures matching the HMAC ID.

## Debugging
- **Wallet Event Streams:** Use the "Idempotency Viewer" in the staging dashboard to visualize exactly when a `seq_num` resolved.
- **Sync Failures:** Local IndexedDB errors output specifically to `console.warn('[SyncEngine]')`. Do not swallow these logs.
- **Idempotency Verification:** If you receive a `409 Conflict`, check if the payload metadata shifted during the offline wait.

## Escalation Paths
Escalate to the Architecture Team if:
- You must add a `.update()` path to a core financial ledger.
- A chaos scenario permanently hangs the service worker sync queue.
- Downstream aggregation calculations begin failing basic arithmetic invariants.
