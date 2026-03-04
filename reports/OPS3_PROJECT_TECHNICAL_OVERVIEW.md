# OPS3 Project Technical Overview

## 1. Project Identity

**Project Name:** Ocean Pearl OPS3  
**Description:** Operational Control System for seafood operations.  

OPS3 is a comprehensive operational control system engineered specifically to govern field-based seafood operations. It is designed to act as the central nervous system for managing physical assets, personnel, and cash across a heavily distributed and historically low-tech environment.

**Core Control Pillars:**
- **Goods Movement:** Traces exact physical quantities (KG) from the moment of capture onto a vessel, through factory yield extraction, into cold storage, and ultimately to out-bound dispatch.
- **Financial Movement:** Tracks exact geographical location of corporate cash floating in the field across discrete "wallets", capturing petty cash outlays, trip funding, and vendor payables in real-time.
- **Operational Discipline:** Blocks speculative actions by requiring users to explicitly open and close constrained sessions (Trips, Shifts) to record data, creating an immutable timeline of operations.
- **Yield Tracking:** Provides visibility into raw input versus finished output metrics to mathematically surface shrink, waste, and substandard production.
- **Risk Detection:** Eliminates blind spots by tracking anomalous behavior such as uncharacteristically high fuel depletion corresponding to low catch ratios.
- **Role-Based Operational Control:** Strictly segregates the user interface into distinct responsibility siloes based on exact physical duties, ensuring workers only see data necessary for their workflow constraint.

---

## 2. Company Operational Model

The structural model within the software strictly reflects the real-world operational topology of the business. The system inherently understands hierarchy layers and maps all transactions against these physical locations.

**Hierarchy Model:**
`Company → Locations → Units`

**Example Topology:**
- **Ocean Pearl Seafood (Company/HQ)**
   - **Kaimana (Location/Hub)**
      - Boat Faris (Unit - Vessel)
      - Boat Susi (Unit - Vessel)
      - Main Processing Floor (Unit - Factory)
      - Kaimana Cold Room (Unit - Cold Storage)
      - Kaimana Logistics Office (Unit - Office)
   - **Surabaya (Location/Hub)**
      - Surabaya Depot (Unit - Cold Storage)

**Operational Relevance:**
- **Units hold inventory:** Physical stock and field cash exist explicitly at the leaf node level (the Unit).
- **Locations aggregate Units:** A Location acts as a consolidation mechanism. The Hub's master inventory is logically derived from summing all its active sub-units.
- **HQ monitors Locations:** Corporate intelligence and Finance operations assess global corporate health by rolling up data from the Location Hubs.

---

## 3. Operational Philosophy

OPS3 breaks away from generic back-office data entry and enforces a philosophy built for immediate, on-the-ground reality.

- **Operational Discipline:** Every interaction is bounded by a rigid state. Operators do not "add records to a database" – they "Start a Trip" or "Close a Shift," creating strict temporal blocks where physical action occurs.
- **Document-Driven Accounting:** Business actions generate immutable, invoice-grade digital documents (Receiving DO, Expense Voucher). These documents act as universal sources of truth for both inventory and accounting ledgers simultaneously.
- **Traceable Goods Movement:** All fish movement is tied to paired entry/exit documents. Inventory is never casually manipulated; it is systematically dispatched and systematically received.
- **Wallet-Based Financial Control:** Cash in the field is treated as a physical geographic asset. Funds are placed into isolated "Wallets" mapped to units (e.g., *TRIP WALLET [B1]*). Operational expenses deplete these specific wallets directly, mirroring physical phenomena.
- **Role-Isolated Interfaces:** An operator's UI is inherently restrictive. The Boat operator interface concerns only Boat metrics. Complex financial reconciliation tasks are completely hidden, relegated instead to subsequent Finance workflows.
- **AI-Assisted Monitoring:** Rather than relying exclusively on manual audits, automated "Shark AI" heuristics scan the ledger constantly, highlighting irregular document patterns long before they escalate into substantive losses.

*Note: OPS3 is not a traditional ERP. It is a field-first operational control system built from the ground up for the realities of decentralized seafood execution.*

---

## 4. Technology Stack (Planned)

The planned technological blueprint prioritizes high-performance client rendering, offline-capable interactions, and massive scale tracking via stateless cloud patterns.

**Frontend:**
- **React** (Component-Based UI Architecture)
- **Vite** (Build Tooling & Fast HMR)
- **Tailwind CSS** (Utility-First Styling & Theming)
- **TypeScript** (Strict Type Enforcement and Intelligent Contract Bindings)

**Backend:**
- **Firebase Functions (Gen2 / Node.js Runtime)** for executing asynchronous micro-services, sweeping ledgers, calculating yields, and performing heavy rules-engine processing behind the scenes.

**Database Layer:**
- **Firestore (NoSQL)** implemented via deep sub-collection schemas allowing highly optimal realtime streaming, isolated multi-tenancy rules, and robust offline caching on mobile hardware.

**Hosting:**
- **Firebase Hosting** for high-speed CDN delivery of the Vite compiled payload.

**AI Intelligence Layer:**
- **Shark AI** custom logic rules engine combined with:
- **Google Vertex AI / Gemini integration** to supply large-scale pattern recognition, plain-English system auditing, and multi-modal fraud reasoning based on raw ledger histories.

---

## 5. Repository Structure

The physical underlying codebase is organized to maintain a permanent divide between user-facing experience logic, server-side data preservation, and project documentation models.

```text
OPS3
 ├ frontend
 │   ├ components     (Reusable interactive atoms/molecules: Tables, Modals)
 │   ├ layouts            (Structural wrappers: Sidebars, Topbars)
 │   ├ screens            (Role-specific bounded contexts: BoatStart, FactoryClose)
 │   └ routes              (Client-side transition mapping logic)
 │
 ├ backend
 │   ├ functions         (Cloud logic triggers, daily chron sweeps, Ledger writes)
 │   ├ services           (Standalone logic: Yield calculators, Inventory tallying)
 │   └ security           (Firestore Security Rules, Role binding checks)
 │
 ├ docs
 │   └ ui
 │        OPS3_BLUEPRINT.html  (The master frozen visual specifications / prototypes)
 │
 └ reports
     OPS3_PROJECT_TECHNICAL_OVERVIEW.md  (High-level systemic blueprints)
```

The `OPS3_BLUEPRINT.html` fundamentally ensures that all internal mechanics are modeled against verified user workflow expectations *before* backend endpoints are written.

---

## 6. System Architecture Overview

The platform decouples human data entry from corporate aggregation via asynchronous ledgers.

**UI Layer:**
The interaction surface exists entirely of role-based screens and workflow-driven interfaces. To the user, they are not entering data into tables; they are filling out standardized "invoice-grade" document form templates mapping to physical clipboards.

**Logic Layer:**
Sitting between the user and the storage, this layer enforces logic limits: verifying wallet deductions don't push physical cash negative, validating inbound transfers match expected dispatched quantities, and rejecting wildly anomalous yield entries based on known historical data.

**Data Layer:**
The database is structured immutably. Operational steps create pure Document Records. Secondary background processes sweep these new Records and generate raw Ledger audit logs mapping to Accounting methodologies (Debit Cash, Credit Revenue), while simultaneously adjusting the actual tracking metrics inside the Wallet/Inventory structures.

**AI Layer (Shark):**
Continuously reviews the Data Layer, seeking anomalies, triggering automated flag actions, locking compromised account configurations, and generating alert dashboards for global command users.

---

## 7. Role-Based Access Model

Data is rigidly siloed to ensure users cannot view or mutate domains outside their direct purview.

- **Unit Operator Roles (Boat / Factory / Cold Storage / Office Admin):** Lowest clearance. Strict interaction with daily operations (starting trips/shifts, receiving, reporting expenses, closing sessions). Bound tightly to specific location nodes.
- **Location Manager:** Hub-level clearance. Primarily tasked with reviewing output metrics across child units, approving field expenses, pushing out transfers, and auditing Hub Cold Room inventories.
- **Finance Officer:** Corporate clearance. Executes centralized AP payment sweeps, logs AR receipts, maps global bank wallets, and analyzes the universal mathematical balance logic without touching direct operational entry points.
- **CEO Command:** Executive clearance. Monitors systemic metrics, overall catch tonnage, systemic yields, critical AI-flagged risk factors, and executes macro-level logic overrides.
- **Investor:** Read-only global visibility of macro assets, P&L estimates, and inventory mark-to-market valuations in a highly sanitized format.
- **System Admin:** Internal infrastructural control. Modifies unit trees, user mappings, sets Firebase Rule overrides, manages SKU configurations, etc.
- **Shark AI:** Non-human autonomous actor. Highest system purview for analyzing raw global datasets continuously.

---

## 8. Document System Design

Every action that changes the state of inventory or corporate cash generates an immutable document reference.

**Core Documents:**
- **Receiving Invoice:** In-bound stock acquisition.
- **Expense Invoice:** Deducts targeted operational cash structures. 
- **Sales Invoice:** Final B2B divestment generating Revenue/AR flows.
- **Processing Batch:** Destroys raw state SKUs to instantiate finished Goods SKUs.
- **Transfer Document:** Moves target SKUs physically between unit entities without altering balance sheets.
- **Manifest (DO):** Paves the logistical outbound exit of a product. 

**Document Lifecycle Paths:**
1. **Draft:** Held locally in client state / pre-validation cache.
2. **Submitted:** Pushed to Location logic for checking. (Optional per workflow)
3. **Posted:** Committed immutably to ledger. Wallet/Inventory state adjusted immediately.
4. **Voided:** Overridden with a contra-entry document to reverse logic trails without deleting physical history. 

To anchor digital transactions to physical reality, generated documents correspond directly with internal A4 preview layouts that contain unique **QR Reference Markers** for subsequent physical signing & validation chains.

---

## 9. Inventory Control Model

Inventory behaves within the laws of physics:
- **Stock never goes negative.** The system actively rejects dispatch or batch-processing documents that demand more physical material than mathematically present.
- **Every movement is documented.** Quantities can ONLY increase via Receiving or Batch Yield output and ONLY decrease via Sales, Transfers, Processing inputs, or explicit Spoilage/Waste logs.
- **Waste & Byproducts are Tracked:** Factory operations demand the input of raw items vs output of finished goods. The missing delta is mathematically logged automatically as either identifiable byproduct or systemic sludge/waste.

---

## 10. Wallet System

A radical divergence from single-pool accounting. Financial flow maps precisely to the real-world dispersion of cash.

- **Corporate Structure:**
   - **Company Wallet:** e.g., HQ Master Bank (BCA) - Primary float.
   - **Location Wallet:** e.g., Kaimana Hub Central Treasury - Disbursed regional funds.
   - **Unit Wallet:** e.g., CS Petty Cash, Factory Ops Cash.
   - **Trip/Session Wallet:** Highest-risk leaf node. Physically disbursed to a Boat or Shift leader to cover immediate daily operations. Requires constant sweeping back to the Unit Wallet.

- **Dynamics:** 
All financial transfers require digital sweeps bridging two specific Wallet boundaries. Field Expense Vouchers immediately impact only the exact Wallet designated (e.g., buying fuel draws exclusively from *TRIP_WALLET_B1*, mathematically protecting Hub logic from field accounting errors). Transactions with external non-cash vendors inherently construct corporate *Accounts Payable (AP)*, awaiting centralized Finance settlement sweeps.

---

## 11. Crew / Employee Balance System

The payroll logic directly reflects local complexities of unstructured employee compensation, inherently factoring in "Kasbon" (Advances) and "Potong" (Deductions).

- **Crew Advances:** During trip opening configurations, physical cash handed out triggers explicit Advance records tightly bound to worker IDs. 
- **Expense Injection:** If mid-trip cash distributions occur, they are recorded natively via the Expense Invoice using the generalized *'Crew/Employee Payment'* expense type, enforcing the selection of a specific worker name to ensure correct deduction mapping.
- **Closure Settlements:** Upon Session/Trip close, the UI cross-references the Worker's total historical/operational advance draws against calculated piecewise wages or profit shares to automatically surface precise Net Settlement totals without relying on disparate spreadsheet auditing. 
All Worker Names securely pull from an Administrative global *People Registry*.

---

## 12. AI Layer — Shark 

OPS3 introduces an integrated logic arbiter representing the operational health of the company. 

- **Operational Alerts & Risk Detection:** Continuous parsing of document timestamps, fuel-to-yield ratio anomalies, and unit idle states explicitly surfaces high-confidence fraud profiles natively into command dashboards.
- **Yield Anomaly Monitoring:** Highlights historical processing deviation (e.g., Factory 1 outputting Fillet at 38% yield versus the 43% baseline threshold) for active command inquiry. 
- **Chat Command Interface:** A natural language LLM binding enables the CEO/Admin layers to interrogate the immutable ledger conceptually ("Did Boat F-14 overdraw fuel compared to logged catch on the last three trips?"), delivering complex reasoning matrices over raw data instantly. 

---

## 13. Development Strategy

Risk-free engineering model.

- **UI-First Blueprint Validation:** Creating the holistic `OPS3_BLUEPRINT.html` ensures complete operational logic buy-in across all complex scenarios prior to database architectural configurations.
- **Operator Workflow Validation:** Proves to stakeholders the exact interaction models match the competency logic of field crews without exposing underlying technical latency. 
- **Backend Implementation:** Follows UI validation tightly, utilizing established API targets derived directly from required UI state data patterns, eliminating "feature drift" during protracted development cycles. 

---

## 14. Deployment Strategy

Final operational architecture relies purely on serverless managed scale frameworks.

- **Frontend Hosting:** Global edge routing via Firebase Hosting ensuring caching logic runs fast even under poor field-based connection parameters.
- **Logic Handling:** Cloud Functions triggered via strict Firestore document-write criteria.
- **Storage:** Firestore native multi-region databases. 
- **Environmental Parity:** Maintains strict discrete configurations for `DEV`, `STAGING`, and `PRODUCTION` variants ensuring complete data segregation during feature iterations.

---
*End of Report.*
