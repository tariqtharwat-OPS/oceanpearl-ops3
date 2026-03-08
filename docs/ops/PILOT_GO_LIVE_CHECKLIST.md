# OPS3 PILOT GO-LIVE CHECKLIST

## 1. PRE-FLIGHT (T-Minus 24H)
- [ ] Environment Variables set (HMAC_SECRET).
- [ ] Cloud Functions (V2) successfully deployed to `asia-southeast1`.
- [ ] Firestore Indexes deployed and active.
- [ ] `v3Bootstrap` callable invoked once for CEO user creation.

## 2. PILOT MASTER DATA (T-Minus 12H)
- [ ] Locations & Units seeded for Pilot Scope (FAC-01, HUB-01, CS-01, Boats).
- [ ] SKUs seeded (raw-tuna, tuna-loin, fuel, ice).
- [ ] Default `control_config` seeded (100c Tolerance, 0.10 Yield).
- [ ] Wallets initialized at zero (Hub-Global set with pilot capital).

## 3. ACCESS & MONITOR (T-Minus 4H)
- [ ] Pilot Custom Claims assigned (Matrix Check).
- [ ] `ops3Monitor` scheduled and 1st cycle confirmed.
- [ ] Recover Tool `rebuild_projections.js` tested on seed data.

## 4. LAUNCH (GO-LIVE)
- [ ] 1st Boat Trip Started.
- [ ] 1st Expense Recorded.
- [ ] 1st Shard in `trip_profit_views` verified.
- [ ] Support Contacts Assigned (Engineer & Ops Lead).

## 5. ROLLBACK / PAUSE PLAN
- [ ] Logic for pausing pilot: Set `control_config/default.status = "PAUSED"` (if implemented) or disable `documentProcessor`.
- [ ] Rollback strategy: Revert to legacy paper log if system downtime > 2 hours.
- [ ] Data wipe: Use `scripts/rebuild_projections.js` on clean ledger source if views corrupt.
