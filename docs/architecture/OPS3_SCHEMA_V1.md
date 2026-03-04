# OPS3 Firestore Data Model (Schema V1)

## Overview & Event-Driven Architecture
Based strictly on the consultant-reviewed architecture, OPS3 employs an **event-driven, immutable ledger** logic natively mapped to Firestore. Operations are completely decoupled from state.

**Key Principles:**
1. **Wallet balances are derived from transactions:** We absolutely do not store mutable scalar balances (e.g., `current_balance: 50000`). Wallets are logical groupings of immutable transactions.
2. **Inventory levels are derived from stock movements:** Physical KG counts are verified mathematically by summing inflow (receiving, yields) vs outflow (dispatch, sales, waste).
3. **No mutable balances stored directly:** Avoids all offline sync conflicts where simultaneous operators override static numeric fields.
4. **All financial and stock events are immutable records:** Once a transaction or document is written, it is permanently sealed. Modifications require contra-entry documents (voids/refunds) to perfectly audit edits.

---

## Conceptual Collections

### `locations`
- Describes hierarchical hub units (e.g., Kaimana, Surabaya).
- Structure primarily serves as an ancestor anchor for rule permissions and aggregate reporting.

### `units`
- Represents physical leaf nodes (Vessels, Factories, Cold Storage rooms).
- Defines unit type, default staff grouping, and parent connection to `locations`.

### `users`
- Maps Firebase Authentication UIDs to explicit roles (e.g., `role_boat`, `role_finance`) and binds the user physically to an operational `unitId` or `locationId`.

### `employees` (Global People Registry)
- Holds non-app-user workers (Fishermen, Crew, Loaders, Mandors).
- Provides static definitions for names, base piecewise calculations, and entity routing.

### `trips` / `shifts` / `sessions`
- Represent bounded temporal constraints controlling operations.
- Contains references to assigned `units`, initiating `users`, opening parameters, and bounding state markers (`draft`, `active`, `closed`).

---

### Transactional Engine (The Ledger)

#### `documents`
- The universally tracking parent wrapper for ANY event (e.g., Expense Vouchers, Receiving Slips, Sales Invoices).
- Stores the digital mapping to the physical paper A4 record, total gross value, created-at timestamps, and the identity of the approving actor.

#### `wallet_transactions`
- Belongs logically to a unified corporate chart-of-accounts structure or localized tags (e.g., *Trip Wallet B1*).
- **Summation Mechanics:** The total viable cash available to Boat Faris is equal to `SUM(wallet_transactions.amount) WHERE wallet_tag = 'TRIP_WALLET_B1'`.
- Adding an expense simply drops a negative value transaction into this collection.

#### `inventory_movements`
- Describes the explicit atomic movement of Stock Keeping Units (SKU) by KG.
- Captures positive vectors (Receiving) and negative vectors (Dispatch/Waste) tagged intricately to target Unit nodes.
- **Summation Mechanics:** The quantity of Snapper Fillet at Kaimana Main CS is equal to `SUM(inventory_movements.kg) WHERE unitId = 'KAIMANA_CS' AND sku = 'SNAPPER_FILLET_A'`.

#### `employee_balance_transactions`
- Records immutable lines of debt or payment allocated to individuals in the `employees` collection (Kasbon, Potong, and Base Wages).
- Eliminates manual spreadsheet calculations. A worker's total accrued debt is exclusively calculated by aggregating these lines.

#### `processing_batches`
- Maps identical inputs and outputs during factory yielding, producing simultaneous pairs of `inventory_movements` (negative draw of raw whole fish, positive injection of finished fillet and byproduct lines).

---

## Summary of Derived State Mechanics
This schema eliminates "dirty writes" by clients functioning on intermittent field LTE/satellite connections. Even if two operators generate simultaneous expenses against the exact same Trip Wallet while fully disconnected from the internet, upon reconnection, Firestore simply merges the two new distinct `wallet_transaction` records into the collection. Subsequent Cloud Functions parse the sum. If the sum indicates an accidental overdraft below zero, the system preserves the audit trail but flags the overdraft asynchronously for command/Shark AI resolution, maintaining perfect temporal accuracy.
