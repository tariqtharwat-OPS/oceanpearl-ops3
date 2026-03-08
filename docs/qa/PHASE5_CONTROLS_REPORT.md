# PHASE 5 — OPERATIONAL CONTROLS & EXCEPTION REPORT

## 1. Objective
Enable proactive monitoring and automated detection of financial and operational anomalies within the seafood supply chain.

## 2. Detected Control Points
The following automated controls are now active in the `documentProcessor`:

| Control Type | Trigger Condition | Alert Collection |
|---|---|---|
| **Yield Variance** | Actual Ratio vs Expected Ratio > 10% | `yield_alerts` |
| **Transfer Aging** | Landed Fish not received after 24h | `transfer_alerts` |
| **AP/AR Overdue** | Creation or Payment after `due_date` | `payable_alerts`/`receivable_alerts` |
| **Inventory Anomaly** | Balance < 0 or abnormally large deltas | `inventory_anomalies` |
| **P&L Mismatch** | Revenue - Expense != Net Profit | `trip_anomalies` |
| **Cost Basis Spike** | Average Cost exceeds 1M per unit | `cost_anomalies` |

## 3. Simulation Evidence (Verified)
Captured from `test_phase5_controls.js`:

- **Yield Variance**: Transformation at 50% yield (Expected 80%) triggered a **CRITICAL** alert. ✅
- **Transfer Aging**: Boat landing aged 72 hours before hub receipt triggered a **DELAYED** alert. ✅
- **AP Overdue**: Purchase document created with an expired due date triggered **OVERDUE_AT_CREATION**. ✅
- **Cost Integrity**: Allocation of 2B IDR to a batch triggered **HIGH_COST_BASIS** anomaly. ✅

## 4. Operational Dashboard Projections
HQ dashboards can now query the corresponding `_alerts` and `_anomalies` collections to identify high-risk events across the entire organizational hierarchy.
