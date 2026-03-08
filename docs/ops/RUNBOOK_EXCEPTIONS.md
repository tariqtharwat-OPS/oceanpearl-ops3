# OPS3 EXCEPTION HANDLING RUNBOOK

## 1. Inventory Anomalies
- [ ] If `inventory_anomalies` record created: Check negative balance source.
- [ ] If `STOCK_DEFICIT` rollback reported: Do not force document. Adjust stock first through manual correction (requires admin).
- [ ] Log: Manual correction audit trail in `audit_logs`.

## 2. Yield Variance
- [ ] If `yield_alerts` record created: Factory line manager inspection.
- [ ] Cause Audit: Calibration, waste report mismatch, or grade variance.
- [ ] Resolution: Correction batch entry or yield threshold adjustment.

## 3. Financial Mismatch
- [ ] If `P&L_MISMATCH` alert in `trip_anomalies`:
- [ ] Run `rebuild_projections.js`.
- [ ] Compare `wallet_events` v `trip_profit_views` shards.
- [ ] Resolution: Document forensic audit in `audit_logs`.

## 4. System Malfunction
- [ ] If processing frozen: Cloud Function logs inspection.
- [ ] If HMAC refused: Check Pilot Environment Checklist (Secret Manager).
- [ ] If Lock failure: Clear `idempotency_locks`.
