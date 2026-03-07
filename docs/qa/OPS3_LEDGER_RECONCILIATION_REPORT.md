# OPS3 Ledger Reconciliation Report: Trip SIM-001

This report provides a strict mathematical proof of the ledger integrity for the simulated trip `TRIP-SIM-001`.

## 1. Wallet Reconciliation (`TRIP-WALLET-B1`)

| Event Type | Event ID | Delta (Rp) | Running Balance |
| :--- | :--- | :--- | :--- |
| Initial Setup | - | +0 | 0 |
| `deposit_cash_handover` | `EVT-INIT-DEP` | +5,000,000 | 5,000,000 |
| `expense` (Line 0) | `DOC-EXP-001_L0_W` | -150,000 | 4,850,000 |
| `expense` (Line 1) | `DOC-EXP-001_L1_W` | -100,000 | 4,750,000 |
| `expense_advance` (L2) | `DOC-EXP-001_L2_W` | -200,000 | 4,550,000 |
| `expense_purchase` | `DOC-BUY-C_L0_W` | -1,000,000 | 3,550,000 |
| `revenue_cash` | `DOC-SALE-C_L0_W` | +4,000,000 | 7,550,000 |
| `expense` (Offline) | `EVT-OFF-EXP` | -50,000 | 7,500,000 |
| `transfer_initiated` | `EVT-REM-CA` | -7,500,000 | **0** |

**Verification**:
- Total Inflow: 9,000,000
- Total Outflow: 9,000,000
- **Final Snapshot Balance**: 0
- **Match Status**: **CONFIRMED**

---

## 2. Inventory Reconciliation (`snapper-grade-a`)

| Event Type | Event ID | Delta (KG) | Running Balance |
| :--- | :--- | :--- | :--- |
| `receive_own` | `EVT-OWN-1` | +50.0 | 50.0 |
| `receive_buy` | `DOC-BUY-C_L0_I` | +20.0 | 70.0 |
| `sale_out` | `DOC-SALE-C_L0_I` | -40.0 | 30.0 |
| `transfer_initiated` | `EVT-SWEEP-INV` | -30.0 | **0.0** |

**Verification**:
- Total Weight In: 70.0 KG
- Total Weight Out: 70.0 KG
- **Final Snapshot Balance**: 0.0 KG
- **Match Status**: **CONFIRMED**

---

## 3. Atomic Invariants Proof

### A. Dual-Impact Consistency
For `DOC-BUY-CASH`, were both weight and money updated?
- `inventory_events` record created: `DOC-BUY-C_L0_I` (+20kg)
- `wallet_events` record created: `DOC-BUY-C_L0_W` (-1,000,000)
- **Status**: Both records exist in the same server-side transaction.

### B. Idempotency Lock Efficiency
Total `document_requests` for this trip: 12
Total `idempotency_locks` in "COMPLETED" state: 12
Total attempts to double-post: 3 (Sales/Closure)
Total successful double-posts: **0**

---

## 4. Auditor Summary
The system accurately reflected the physical movement of assets. No "ghost funds" or "phantom weight" were created or lost during the transitions. Remittance to the Hub accounts for all remaining assets.
