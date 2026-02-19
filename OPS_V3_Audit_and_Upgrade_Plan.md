# Ocean Pearl OPS V3: Architecture Audit & Upgrade Plan

This document presents a comprehensive architecture audit, gap analysis, execution plan, and risk assessment for the Ocean Pearl OPS V3 upgrade. The analysis is based on the authoritative `Ocean_Pearl_OPS_V3_Master_Blueprint.docx` and a review of the current `oceanpearl-ops-v2` repository.

---

## STEP 1 — SYSTEM UNDERSTANDING

This section outlines the understanding of the target architecture for Ocean Pearl OPS V3, based on the provided `Ocean_Pearl_OPS_V3_Master_Blueprint.docx`. It serves as the foundation for the subsequent gap analysis and execution plan.

### 1. Organizational Model

The organizational structure is hierarchical, designed to model the company's physical and operational distribution.

| Concept | Description |
| :--- | :--- |
| **Location** | A geographic or operational region, such as 'Kaimana' or 'Jakarta'. It is the top-level container and has no specific 'type'. |
| **Unit** | An operational entity that **must** belong to a single Location. Units have a specific `unitType` (e.g., BOAT, PROCESSING_FACTORY) that defines their function. |
| **Parent Unit** | A specific relationship where a `BOAT` unit can be optionally attached to another unit (e.g., a factory) for management purposes. This is a flexible relationship that can be changed over time. |

#### Unit Reassignment Logic

Units, specifically boats, can be moved between locations or reassigned to different parent units. This process is managed by a `CEO` or `Admin` role. Crucially, historical transaction data is **not** rewritten upon reassignment. Instead, a new entry is created in a `unit_reassignments` log with an effective date, ensuring a complete and auditable history of unit movements.

### 2. Unit-Specific Workflows

A core principle of OPS V3 is that each `unitType` has a dedicated, specialized workflow engine and user interface, avoiding generic, one-size-fits-all screens. This ensures operational correctness and a user experience tailored to the specific tasks of each unit.

#### Boat Trip Model

The boat workflow is centered around a `Trip` model with a clearly defined lifecycle and strict requirements for state transitions.

-   **States:** `IDLE`, `PREPARING`, `ON_TRIP`, `RETURNED`, `DELIVERING`, `TRIP_CLOSED`, `ON_MAINTENANCE`.
-   **Trip Start:** Requires crew assignment, advance funds, initial expenses, fishing method, and an expected return date.
-   **Ownership Modes:** A critical feature is the `MIXED` ownership mode per trip, allowing catch to be classified as either `COMPANY-owned` or `CREW-owned`.
-   **Data Logging:** During a trip, crew can record catch multiple times, log expenses, and even transfer catch to other boats.
-   **Delivery & Variance:** Delivery can be partial or final. Any variance between the recorded catch and the delivered amount is logged, and Shark V3 generates alerts based on predefined tolerances.
-   **Trip Closure:** A trip can only be closed when all catch is delivered, all expenses are recorded, crew shares are calculated, the wallet is settled, and the final variance is logged.

#### Drying Warehouse (Anchovy) Workflow

This workflow is designed for processing fresh anchovies into dried, graded, and packed products.

-   **Process:** The warehouse takes fresh anchovies, dries them, grades them into sizes (Big/Medium/Small) and qualities (A/B/C), and then packs them.
-   **Batch Model:** The workflow is batch-oriented, with states: `DRAFT`, `ACTIVE`, `READY`, `TRANSFERRED`, `CLOSED`, `CANCELLED`.
-   **Costing:** The cost of a batch is finalized manually, which then triggers the posting of ledger entries. This allows for flexibility in adding various costs incurred during the process.
-   **Shark Monitoring:** Shark V3 actively monitors for mass imbalance, abnormal loss, unusual grade distributions, yield percentages, cost/kg spikes, and processing delays.

#### Processing Factory Workflow

The factory is a more complex unit that handles various processing types.

-   **Hybrid Model:** It supports both `batch` and `continuous` processing modes.
-   **Flexible Recipes:** The system accommodates both fixed, core processing types and user-defined recipes.
-   **Comprehensive Yield Tracking:** Yield is tracked across multiple dimensions: by batch, species, operator, processing type, and unit.
-   **By-product Management:** By-products can be managed flexibly: they can become inventory, be sent to the fishmeal plant, sold directly, or written off.
-   **Quality Control:** QC is a mandatory step, requiring temperature checks, grade approvals, rejection logging, and the signature of a QC officer.

#### Other Unit Workflows

-   **Cold Storage:** Manages frozen inventory, including lot identity, pallet/container assignment, reservations, transfers, and shipment preparation. Shark monitors aging and stock mismatches.
-   **Fishmeal Plant:** A specialized batch conversion unit that processes waste from factories and drying warehouses into fishmeal. Shark monitors efficiency and margin.
-   **Sorting/Reclassification:** This is a dedicated, distinct workflow, not just a part of processing. It allows for re-bucketing of lots by different size/grade schemes, tracks loss/gain, and enables Shark to monitor the profitability of the reclassification process itself.

### 3. Species & Product Architecture

The system employs a flexible and user-configurable architecture for managing species and products, allowing for dynamic adjustments as business needs evolve.

| Feature | Description |
| :--- | :--- |
| **Species Definition** | Each species is defined by both an Indonesian and an English name. They are also assigned to a user-editable category. |
| **Size & Grade Schemes** | Crucially, `Size Schemes` and `Grade Schemes` are defined on a **per-species** basis. This allows for different classification systems for different types of fish. Both schemes support inline additions during the receiving process. |
| **Product Definition** | Products are linked to a species and are user-defined. A key feature is the inclusion of an `expected/standard yield %` for each product, which is a critical input for Shark V3's monitoring. |

#### Buy vs. Stock Classification

A key concept is the decoupling of how a product is classified at the time of purchase (`Buy Classification`) versus how it is classified for internal stock-keeping and sales (`Stock Classification`). This is a sophisticated feature that reflects the reality of seafood processing, where initial grading may be rough and require refinement.

#### Yield Tracking and Shark Monitoring

Yield tracking is a central theme. The `expected yield %` set at the product level serves as a baseline for Shark V3. The dedicated **Sorting/Reclassification workflow** is the mechanism that bridges the `Buy` and `Stock` classifications. During this process, Shark V3 monitors for anomalies in yield, including both loss and gain, and assesses the profitability of the remapping from buy-side grades to sell-side grades. This provides powerful, actionable intelligence on the efficiency and profitability of the sorting process.

### 4. Finance Architecture

The finance architecture is designed to be robust, auditable, and scalable, using a hybrid model that combines the rigor of a traditional accounting system with the performance of materialized views.

| Concept | Description |
| :--- | :--- |
| **Hybrid Double-Entry Ledger** | The financial source of truth is a collection of immutable `ledger_entries`. All financial events are recorded as double-entry transactions. Reversals are used for corrections, never direct edits or deletions, ensuring a complete audit trail. |
| **Wallet Materialization** | For performance and ease of access, `Wallets` are materialized views. These are updated by event-driven functions that listen to changes in the `ledger_entries` collection. This provides fast access to balances for dashboards and Shark V3 without needing to query the entire ledger each time. |
| **Moving Average Valuation** | Inventory is valued using the Moving Average method. This means the cost of goods is recalculated after each new purchase, providing a more current valuation than methods like FIFO or LIFO. |
| **Idempotency** | Every financial and operational write path **must** be idempotent. This is achieved by passing an `idempotency key` with each transaction, which is written inside the same atomic batch as the financial and operational data. This prevents duplicate transactions and ensures data integrity, even in the case of network failures or retries. |
| **Partner Balance Model** | A single, global running balance (Debit – Credit) is maintained for each partner (Supplier, Buyer, Agent, etc.). The breakdown of this balance by unit or location is achieved by querying the ledger entries, which contain this dimensional data. |
| **Inter-unit Transfer Configuration** | Transfers of goods between units can be configured to occur at either `cost` or with a `markup`. This provides the flexibility to treat inter-unit transfers as either cost-neutral movements or as internal sales, impacting the profitability analysis of each unit. |

### 5. Role Architecture

The system defines a clear set of roles with specific permissions, ensuring that users only have access to the information and actions relevant to their responsibilities. This is enforced through server-side checks, not just UI-level hiding.

| Role | Key Responsibilities & Permissions |
| :--- | :--- |
| **Admin** | Full system access. Can manage all master data, including locations, units, users, and system settings. Has the same level of authority as the CEO. |
| **CEO** | Top-level oversight and control. Can edit and move units across locations, approve high-value transactions, and view all financial and operational data. Receives all high-priority alerts from Shark V3. |
| **Location Manager** | Manages all units and operations within a specific geographic location. Can approve transactions up to a certain threshold and is responsible for the P&L of their location. Receives alerts relevant to their location. |
| **Unit Operator** | The primary user for day-to-day operations within a specific unit (e.g., a boat, a factory). Their access is strictly scoped to their assigned unit and the specific workflows of that unit type. |
| **Finance Officer** | Manages financial operations, including reconciling accounts, managing payments, and overseeing the ledger. Has access to financial data across the organization. |
| **Investor (Scoped)** | A read-only role with access scoped to specific units, locations, or the entire organization, as configured. Can view financial performance and receive relevant Shark V3 alerts, but cannot perform any transactions. |

### 6. Shark V3

Shark V3 is the intelligent, always-on monitoring and alerting system that acts as the CEO's virtual representative within the OPS V3 ecosystem. It is not a passive reporting tool but an active, event-driven system designed to provide real-time insights and detect anomalies.

| Feature | Description |
| :--- | :--- |
| **Event-Driven Materialized Views** | Shark V3 operates on materialized views that are updated in real-time by event-driven functions. These functions listen for changes in core data collections (like `ledger_entries` and `inventory_lots`) and update aggregated views (like `shark_view_wallets` and `shark_view_stock`). This ensures that Shark's analysis is always based on the latest data without requiring expensive, full-table scans. |
| **Alert Generation** | When these event-driven functions detect a deviation from expected norms (e.g., a negative wallet balance, a significant inventory variance, a low-yield processing batch), they generate alerts. These alerts are stored in a dedicated `shark_alerts` collection and are routed to the appropriate personnel based on severity and scope. |
| **Margin/Yield Anomaly Detection** | A key function of Shark V3 is to move beyond simple data validation and into the realm of business intelligence. It actively monitors the profitability of operations by tracking margins on sales and yields from processing, sorting, and drying activities. It flags anomalies, such as a sudden drop in the profitability of a specific product or a consistently low yield from a particular boat or factory team. |
| **WhatsApp Read-Only Integration (Twilio)** | Shark V3 provides a read-only WhatsApp interface, powered by Twilio. This allows authorized users (like the CEO or a Location Manager) to query key information, such as stock levels or partner balances, directly from their mobile devices without needing to open the full application. This provides immediate access to critical data, anytime, anywhere. In addition to the Q&A, critical alerts are pushed to relevant stakeholders via WhatsApp. |
| **Scope Inheritance** | Shark V3's access and alerting are context-aware. It inherits the scope of the user interacting with it. For example, a Location Manager will only receive alerts and be able to query data relevant to their own location. The CEO, on the other hand, has a global view. This ensures that information is delivered to the right people and that data access is appropriately restricted. |

---

## STEP 2 — GAP ANALYSIS

This section details the gaps between the current `oceanpearl-ops-v2` repository and the target architecture defined in the `Ocean_Pearl_OPS_V3_Master_Blueprint.docx`. The analysis covers structural mismatches, incomplete workflows, and risks across the application.

### 1. Structural Mismatches

The current `v2` codebase has a fundamentally different and simpler structure compared to the V3 blueprint. The core architecture requires a complete rewrite.

| Area | V3 Blueprint Requirement | V2 Current State (Mismatch) |
| :--- | :--- | :--- |
| **Unit Workflows** | Dedicated, stateful workflow engines for each `unitType` (Boat, Factory, etc.). | A set of generic, stateless functions (`receiveLot`, `productionTransform`). There is no concept of a boat trip, a drying batch, or a processing recipe. This is the most significant structural gap. |
| **Financial Core** | Immutable, double-entry ledger as the source of truth. | A simple `ledger_entries` collection is present, but it functions more as a single-entry transaction log. It lacks the rigor of a double-entry system, and there is no evidence of a chart of accounts or proper debit/credit handling for complex transactions. |
| **Data Model** | Rich, interconnected models (e.g., per-species size/grade schemes, buy vs. stock classification, parent units). | The data models are flat and disconnected. There are no per-species schemes, no distinction between buy/stock classifications, and no `parentUnitId` for boats. |
| **UI Architecture** | Role-scoped, tile-based dashboards with breadcrumb navigation for deep workflows. | A monolithic frontend (`App.tsx`) with a few hardcoded page components (`AdminPanelFull`, `Operations`, etc.). It is not role-driven and lacks the modular, tile-based structure required. |

### 2. Incomplete Workflows

Virtually all core operational workflows described in the V3 blueprint are either completely missing or exist only in a rudimentary, non-functional form in the V2 codebase.

- **Boat Trip Workflow:** **Completely Missing.** The current system has no concept of a boat `trip`. There is no state machine, no crew management, no expense tracking, and no settlement process. The existing `receiveLot` function is a generic inventory addition, not a boat-specific workflow.
- **Drying Warehouse Workflow:** **Completely Missing.** There is no batch model for drying, no concept of grading into multiple sizes/qualities, and no manual cost finalization process.
- **Processing Factory Workflow:** **Critically Underdeveloped.** The `productionTransform` function is a simple mass-balance check (input = output + waste). It lacks support for recipes, by-product routing, QC steps, and continuous processing.
- **Sorting/Reclassification Workflow:** **Completely Missing.** The crucial workflow for remapping `buy` classifications to `stock` classifications does not exist. This is a major gap, as it's central to the inventory valuation and profitability tracking strategy.
- **Sales Workflow:** **Rudimentary.** The `recordSale` function is a simple, single-step process. It lacks the `Advanced Sale Order` flow, approval rules, and proper handling for agent commissions as a company expense.

### 3. Broken Logic & Major Risks

Beyond incomplete features, the existing V2 code contains flawed logic and significant risks that make it an unsuitable foundation for V3.

#### Finance & Security Risk Points

| Risk Category | Specific Finding | Implication |
| :--- | :--- | :--- |
| **Financial Integrity** | **Not a Double-Entry System:** The current `ledger_entries` collection acts as a simple transaction log, not a balanced, double-entry system. The `receiveLot` function, for example, debits a cash wallet and credits a supplier, but there is no corresponding entry to account for the increase in inventory assets. | It is impossible to generate a balanced trial balance or accurate financial statements. This is a critical failure for any system managing finances. |
| **Financial Integrity** | **No Inventory Valuation:** The system lacks a moving average cost engine. Inventory value is not tracked, so the Cost of Goods Sold (COGS) cannot be calculated, making profitability analysis impossible. | The business cannot know the true value of its inventory or the profitability of its sales. |
| **Security** | **Overly Permissive Firestore Rules:** The `firestore.rules` file allows any authenticated user to read sensitive collections like `locations`, `units`, and `users`. This directly contradicts the V3 blueprint's requirement for server-side-only access to sensitive data. | Any user, regardless of their role, could potentially access and exfiltrate sensitive operational data. This is a major security vulnerability. |

#### Shark Intelligence Gaps

The current implementation of "Shark" is a shadow of the V3 requirement.

- **Flawed View Logic:** The event-driven functions in `shark_events.js` are built on brittle assumptions. For instance, they parse `walletId` strings to determine scope, which is unreliable and will break if naming conventions change. This is not a robust way to build materialized views.
- **Superficial Alerting:** Shark V2 only alerts on basic data integrity issues like negative balances. It completely lacks the core intelligence of V3: **anomaly detection for margins and yields**.
- **Missing Integrations:** The WhatsApp (Twilio) integration for Q&A and alerts is entirely absent.

### 4. Areas Requiring Full Rewrite vs. Refactor

Given the profound architectural and logical gaps, the path forward is clear.

- **Areas to be Refactored: None.** The existing V2 codebase is not a suitable starting point for the V3 system. The architectural paradigm is fundamentally different. Attempting to refactor this code would be more time-consuming and result in a compromised, unstable product than starting with a clean slate.

- **Areas Requiring Full Rewrite: Everything.**
    - **Firestore Data Model:** Must be completely redesigned and implemented from scratch to support the V3 schemas.
    - **Backend (`functions`):** All Cloud Functions must be rewritten to implement the stateful, unit-specific workflow engines, the double-entry ledger, moving average costing, and correct security enforcement.
    - **Frontend (`frontend`):** The entire user interface must be rebuilt from the ground up to support the role-scoped, tile-based dashboard architecture and the dedicated screens for each operational workflow.
    - **Shark V3 (`shark_events.js`):** The entire intelligence layer must be rewritten to correctly implement event-driven materialized views, sophisticated anomaly detection, and the WhatsApp integration.

---

## STEP 3 — EXECUTION PLAN (48-HOUR TARGET)

This document outlines a realistic execution plan to upgrade the Ocean Pearl OPS system to a minimal, viable V3 status within the requested 48-hour deadline. The plan acknowledges the findings of the Gap Analysis, which concluded that a **full rewrite is necessary**.

This plan prioritizes delivering a stable, financially sound core with one complete, simplified operational workflow. It respects the dependency order outlined in the `Controlled Rebuild Roadmap` while aggressively simplifying and deferring non-essential features to meet the deadline.

### Guiding Principles

- **Rewrite, Don't Refactor:** The V2 codebase will be frozen and used for reference only. All V3 code will be new.
- **Core Finance First:** The immutable, double-entry ledger is the highest priority. Without it, the system is not viable.
- **One Workflow End-to-End:** To prove the architecture, we will implement one simplified workflow completely, from receiving to sale.
- **Simplify Aggressively:** Features will be implemented in their most basic form to meet the deadline. Complexity will be deferred.

### Execution Plan: Timeline & Blocks

#### Day 1: Foundational Rewrite (Hours 0-24)

| Block | Hours | Roadmap Phase(s) | Tasks & Focus | Risk | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | 0-4 | 0, 1, 2 | **Project Setup & Schemas:**<br>• Perform clean reset of Firestore.<br>• Tag repo and set up new V3 branch.<br>• **Rewrite & Deploy:** All V3 data schemas (Locations, Units, Partners, Species, Products).<br>• **Rewrite & Deploy:** Basic auth with test users for all roles. | Low | **Mandatory** |
| **2** | 4-16 | 3 | **Finance Core Rewrite:**<br>• **Rewrite:** The immutable double-entry ledger engine.<br>• **Rewrite:** The idempotency framework for all database writes.<br>• **Rewrite:** The event-driven wallet materialization engine.<br>• **Rewrite:** The Moving Average Valuation logic for inventory costing. | High | **Mandatory** |
| **3** | 16-24 | 4, 7 | **MVP Workflow & UI Shell:**<br>• **Rewrite:** A simplified **Drying Warehouse** batch workflow. This is the most self-contained flow (Input -> Process -> Output).<br>• **Rewrite:** The basic frontend shell with role-based routing and a tile-based dashboard structure. No styling, just functional components. | Medium | **Mandatory** |

#### Day 2: Integration & Viability (Hours 24-48)

| Block | Hours | Roadmap Phase(s) | Tasks & Focus | Risk | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **4** | 24-36 | 5 | **End-to-End Flow:**<br>• **Rewrite:** A simplified **Simple Sale** workflow.<br>• **Integrate:** Connect the output of the Drying Warehouse workflow to the sales workflow, ensuring COGS is correctly posted using the Moving Average cost. | Medium | **Mandatory** |
| **5** | 36-44 | 8, 9 | **Shark V3 MVP & Testing:**<br>• **Rewrite:** Event-driven triggers for `shark_view_wallets` and `shark_view_stock`.<br>• **Implement:** One critical alert (e.g., Negative Balance).<br>• **Test:** The full, end-to-end workflow (Receive -> Dry -> Sell -> Payment). | High | **Mandatory** |
| **6** | 44-48 | 10 | **Finalization & Lockdown:**<br>• Final deployment of all rewritten components.<br>• **Rewrite & Deploy:** Strict Firestore security rules, locking down all direct client access.<br>• Document the implemented MV-V3 scope. | Low | **Mandatory** |

### Scope Definition for 48-Hour Target

To achieve a working system in 2 days, the scope must be strictly controlled.

- **What Must Be Fully Rewritten (for MV-V3):**
    - Core data schemas (Locations, Units, Partners, Species, Products).
    - The entire Finance Core (Ledger, Idempotency, Wallets, Moving Average).
    - The UI shell and role-based navigation.
    - One simplified unit workflow (Drying Warehouse).
    - The Simple Sale workflow.
    - The core Shark V3 materialized views (stock and wallets).

- **What Must Be Simplified:**
    - **Workflows:** All but the Drying Warehouse workflow are deferred. The Drying Warehouse workflow itself will be simplified (e.g., no complex loss categories).
    - **Sales:** Only the `Simple Sale` mode will be implemented. No advanced sale orders, complex payment terms, or approval flows.
    - **UI/UX:** The focus will be on functionality, not aesthetics. The UI will be a barebones implementation of the tile-based layout.
    - **Shark V3:** Will only provide materialized views and one basic alert type. No margin/yield analysis, no WhatsApp integration, no daily briefings.

- **What Must Be Frozen:**
    - The entire `oceanpearl-ops-v2` codebase. It will not be touched or migrated.

- **What Must Be Deferred (Post 48 Hours):**
    - All other unit workflows (Boat Trip, Factory, Cold Storage, Fishmeal, Sorting).
    - Advanced Sales features (Sale Orders, approvals).
    - Asset Management & Depreciation.
    - The full suite of Shark V3 intelligence (anomaly detection, WhatsApp).
    - Bluetooth printing.
    - Detailed UI styling and user experience refinements.

---

## STEP 4 — RISK DECLARATION

This document provides a direct and honest assessment of the risks associated with the 48-hour upgrade target for Ocean Pearl OPS V3.

### Can Blueprint-Level Functionality Be Achieved in 2 Days?

**No. It is not realistically possible.**

The Gap Analysis confirms that the V2 system is fundamentally and architecturally different from the V3 blueprint. The required changes are not a refactor or an upgrade; they constitute a **complete and total rewrite** of the entire application stack, from the database schema and security rules to the backend business logic and the frontend user interface.

To build the full V3 system as described in the blueprint would require weeks of development, not days. The complexity of the interconnected, stateful unit workflows, the double-entry financial core, and the sophisticated Shark V3 intelligence layer cannot be rushed. Attempting to do so would guarantee a buggy, unreliable, and financially dangerous system.

### Minimal Viable V3 (MV-V3)

The 48-hour execution plan is designed to deliver a **Minimal Viable V3 (MV-V3)**. This is the absolute minimum scope required to have a functional, financially sound system that can serve as a stable foundation for future development.

**The 48-Hour MV-V3 looks like this:**

- **Core:** A robust, rewritten financial core with a proper double-entry ledger and moving average cost valuation.
- **One Workflow:** A single, simplified end-to-end workflow (e.g., Drying Warehouse -> Simple Sale) to prove the architecture works from inventory acquisition to sale and payment.
- **Basic UI:** A functional, but unstyled, tile-based UI that enforces role-based access.
- **Basic Shark:** Materialized views for stock and wallets, with one or two critical alerts (e.g., negative balance). No advanced analytics or WhatsApp integration.

This MV-V3 will be a stable, working application that correctly handles its core financial and inventory data for one process. It will be a solid platform upon which the remaining V3 features can be built in subsequent development phases.

### Brutally Honest Assessment

- **The 2-day deadline is for a foundational rewrite, not a full V3 system.**
- **Any attempt to implement the full V3 scope in 48 hours will fail and likely lead to data corruption and financial inaccuracies.**
- **The proposed MV-V3 is an ambitious but achievable target that delivers the most critical business value first: a trustworthy financial and inventory system.**

We must proceed with the understanding that the 48-hour goal will deliver the **starting point** of V3, not the final destination.
