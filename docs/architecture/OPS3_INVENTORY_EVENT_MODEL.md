# OPS3 Inventory Event Model

## Immutable Derivation
All inventory stock levels are strictly derived from an immutable `InventoryEvent` collection.
There are **no mutable stock fields** (e.g., `current_kg`) on product entities or storage locations. Inventory levels are computed aggregations of all historical events for a given species, grade, and location.

## Event Types
1. `receive_own`: Adds stock (Origin: Company Boat Catch).
2. `receive_buy`: Adds stock (Origin: Vendor Purchase).
3. `transfer_out`: Subtracts stock (Origin: Current Location).
4. `transfer_in`: Adds stock (Origin: Sender Location).
5. `sale_out`: Subtracts stock (Origin: Current Location).
6. `waste_out`: Subtracts stock (Origin: Current Location, Dest: Spoilage).
7. `batch_input`: Subtracts stock (Origin: Raw Material).
8. `batch_output`: Adds stock (Origin: Finished Goods).
9. `byproduct_output`: Adds stock (Origin: Scrap/Waste for Sale).

## Negative Stock Prevention
- The cloud backend enforces a strict invariant: `SUM(events) >= 0`.
- Offline sales/transfers calculate against an optimistic local cache.
- If a sync results in negative inventory, the specific offending event is rejected with a `STOCK_DEFICIT` error and the transaction must be manually reconciled. No cascading corruption is possible.

## Offline Conflict Handling
- If two offline devices consume the exact same payload, the first to sync succeeds. The second to sync encounters a deficit and fails.
- The UI must dynamically flag the failed event in an "Unresolved Sink" for the operator to handle.
