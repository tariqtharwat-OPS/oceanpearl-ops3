# OPS3 PILOT SUPPORT PLAN

## 1. Daily Reconciliation Cycle (Daily @ 18:00)
- [ ] Lead Op: Check `trip_profit_views` for closed trips.
- [ ] Lead Op: Cross-reference `Hub-Global` wallet delta with `wallet_events`.
- [ ] Lead Op: Verify `stock_views` for negative balance alerts in `inventory_anomalies`.

## 2. Shift Monitoring
- [ ] **Who checks alerts**: Location Manager (HUB-01, FAC-01).
- [ ] **Who checks transfers**: Destination Manager (CS-01).
- [ ] **Who checks settlement**: Finance Lead.

## 3. Support Severity Levels
- **Level 1 (Critical)**: `STOCK_DEFICIT` or `OVERDRAFT_BLOCKED` prevents real industrial flow.
  - **Action**: Engineer Response < 30m.
- **Level 2 (High)**: `P&L_MISMATCH` or `YIELD_ALERT` detected.
  - **Action**: Operational lead audit followed by manual doc correction within 4h.
- **Level 3 (Low)**: Data visualization error in views (correctable via `rebuild`).
  - **Action**: Resolution next daily sync.

## 4. Escalation Matrix
- **Level 1**: Engineer -> CTO -> Project Lead.
- **Level 2**: Lead Op -> Finance Lead.
- **Level 3**: Ops Support -> Analyst.

## 5. Pilot Pause Procedure
In case of catastrophic system failure:
1. Notify all Pilot users (Slack/WhatsApp).
2. Switch to Paper Journals.
3. Disable `documentProcessor` trigger (if necessary).
4. Initiate `scripts/rebuild_projections.js` after engineering fix.
