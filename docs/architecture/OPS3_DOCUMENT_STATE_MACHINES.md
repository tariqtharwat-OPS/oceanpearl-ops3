# OPS3 DOCUMENT STATE MACHINES

## Core Architecture
OPS3 represents physical maritime logistics, making documents exactly congruent to the real-world operational flows. Documents govern every shift of state boundaries, and all documents follow a strictly controlled State Machine enforcing Role Based Logic constraints. A post-state document is immutable. A voided state completely kills a document.

### Allowed Base States
1. `DRAFT`: Local to the creator device only (Cache). Not synced globally. Mutable.
2. `SUBMITTED`: Fired to Firestore. Creates `PENDING` sub-transactions. Read-only for creator. Awaiting Review.
3. `APPROVED`: Validated by bounds or human Location Manager. Triggers `POSTED` sub-transactions. Live in ledger.
4. `POSTED`: Final successful consummation (especially two-phase receipts). Irreversible unless voided with an override.
5. `VOID`: Admin/Shark forced nullification. Flips sub-transactions to `state = REVERSED`.

---

## Document State Matrices by Blueprint Function

### 1. Document Form Type: EXP (Expense Vouchers)
*Used across `boat_exp`, `fac_exp`, `cs_exp`, and `off_exp`.*

**Workflow Steps:**
- Boat logs fuel expense. -> `SUBMITTED`.
- The system checks rules (e.g., `< 5M Limit`). 
- If valid -> Skips manager -> `APPROVED` (Auto).
- If violation -> Location Manager manually clicks -> `APPROVED` via `loc_app_exp`.
- Sub-trasactions (Ledger Float `-`) immediately flip to `POSTED` upon approval.

**Immutable Mutability Limits:**
Once `SUBMITTED`, amounts cannot be edited by the creator. If rejected, they must VOID the `SUBMITTED` doc and generate a new one.

---

### 2. Document Form Type: REC (Receiving)
*Used across `boat_own`, `boat_buy`, `fac_recv`, and `cs_recv`.*

**Workflow Steps:**
- Boat weighs catch -> `SUBMITTED`.
- Value generated from MDM SKU price table automatically approves doc.
- `POSTED` triggers an inbound inventory flow (Stock `+`) inside `WALLET_B1_TRIP`.
- Kaimana CS (Main Depot) physically scans Boat B1 Drop-off.
- The `TRF` doc moves it to `POSTED` resolving the two-phase flow in CS.

---

### 3. Document Form Type: TRF (Outbound Transfers / Delivery Orders)
*Used across `fac_trf`, `cs_load`.*

**Workflow Steps:**
- Factory packages Box 099. Logs outbound `TRF` to Cold Storage -> `SUBMITTED` & `PENDING` reception.
- Cold Storage logs inbound reception of `TRF`. DO matches -> `POSTED`.
- Stock (`-`) from Factory vault. Stock (`+`) into CS vault.
- *Mismatch Handling:* CS logs missing 5KG. The `TRF` status breaks into a `DISCREPANCY` alarm triggering the `loc_app_recv` screen in the Location Manager dashboard to force a write-off or resolution.

---

### 4. Document Form Type: BATCH (Processing Production)
*Used entirely within `fac_batch`.*

**Workflow Steps:**
- Factory inputs 100KG Raw Material (Whole Fish). Logs out yield of 45KG Fillet A and 20KG Fillet B.
- Hits -> `PROCESSED` (Equivalent to `POSTED`). 
- Instant zero-sum swap: 100KG Raw (`-`), 45KG Fillet A (`+`), 20KG Fillet B (`+`). Waste is computed mathematically by the Shark AI module and verified against `adm_mdm` expected yield limits. 

---

### 5. Document Form Type: CLOSURE (Session Shift Termination)
*Used across `boat_close`, `fac_close`, `cs_close`, and `off_close`.*

**Workflow Steps:**
- Operator logs all physical cash on hand, requests Zero-out -> `SUBMISSION_LOCKED`.
- Location Cashier reads the printed summary preview via `xyz_print`, accepts funds, scans the hash payload.
- State flips to -> `POSTED`.
- Active operational ID context vanishes for the operator. The session drops.
