# OPS3 Inventory Event Model

## Immutable Derivation
All inventory stock levels are strictly derived from an immutable `InventoryEvent` collection.
There are **no mutable stock fields** (e.g., `current_kg`) on product entities or storage locations. Inventory levels are computed aggregations of all historical events for a given species, grade, and location.

## Event Types
1. `receive_own`: Adds stock (Company Boat Catch).
2. `receive_buy`: Adds stock (Vendor Purchase).
3. `transfer_out`: Subtracts stock (Origin location).
4. `transfer_in`: Adds stock (Destination location).
5. `transfer_cancelled`: Adds stock back to sender (Aborted transit).
6. `rejected_receipt`: Denies stock addition, returns to vendor/sender.
7. `sale_out`: Subtracts stock.
8. `waste_out`: Subtracts stock (Spoilage).
9. `batch_input`: Subtracts stock (Raw Material into processing).
10. `batch_output`: Adds stock (Finished Goods).
11. `byproduct_output`: Adds stock (Scrap/Waste for Sale).
12. `physical_count`: Assertive stock count.
13. `adjustment_reason_code`: Differential event generated to reconcile physical vs computed stock.

## Traceability & Quality Grading
- **Batch Traceability:** Every transformation event (`batch_output`) generates a unique `batch_id`. Moving or selling this stock requires passing the `batch_id`. `source_batch_id` linkages allow full backward traversal from customer sale to origin catch.
- **Quality Grading:** `quality_grade` (e.g., A, B, Rej) is a required dimension on receipt and processing output.

## Negative Stock Prevention & Safety
- **Strict Invariant:** The cloud backend enforces `SUM(events) >= 0` per location/species/grade/batch. Syncing an event that drives the cloud state negative is rejected (`STOCK_DEFICIT`).
- **Dependency Checks:** An event cannot be voided or contra'd if downstream events have already consumed the resulting stock. (e.g., You cannot void a `receive` if the received items were already processed in a `batch_input`).
- **Physical Count Workflow:** Discrepancies between system `SUM(events)` and physical reality require an explicit `physical_count` leading to paired `adjustment_reason_code` events.

## Offline Conflict Handling
- Offline sales/transfers calculate against an optimistic local cache.
- If two offline devices consume the same target payload (e.g., Selling the last 100kg of Batch A), the first to sync succeeds. The second to sync fails the Negative Inventory check.
- The UI dynamically flags the failed event in a "Resolution Queue" for the operator to handle manually.
