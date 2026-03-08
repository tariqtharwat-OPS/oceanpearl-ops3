# Phase 2: Factory & Hub Architecture Blueprint

**Scope:** Factory Operations, Processing, and Global Hub Logistics.

## 1. Functional Scope
Phase 2 extends the Boat MVP into a multi-stage industrial processing system where raw fish (inputs) are transformed into processed products (outputs) with yield accounting and waste tracking.

## 2. Core Workflows

### 2.1 Hub Receiving Flow
*   **Boat Handover:** Validation of `trip_closure` signals. Physical audit of fish arriving at the landing dock.
*   **Receiving Transaction:** Moving inventory from `unit_id: Boat-X` to `unit_id: Hub-Coldstorage`.
*   **Quality Grading:** Secondary inspection during intake to update quality metadata before processing.

### 2.2 Processing Workflows (Yield Transformation)
*   **Transformation Event:** A processing batch (Batch ID) consumes a set quantity of raw material and produces multiple output SKUs.
    *   *Example:* Consume 100kg Whole Snapper -> Produce 40kg Fillet, 5kg Roe, 55kg Waste.
*   **Yield Ratio Calculation:** Real-time variance tracking against "Expected Yield" standards. Alerts generated for batches falling below tolerance.
*   **Work-In-Progress (WIP):** Inventory states for items in multi-day processing (e.g., drying, curing).

### 2.3 Multi-Product Outputs
*   **Maw / Roe Extraction:** High-value by-product accounting.
*   **Packaging & Barcoding:** Final SKU generation with Lot IDs for export traceability.

### 2.4 Waste Accounting
*   **Disposal Logs:** Tracking organic waste vs. non-organic waste.
*   **By-product Conversion:** Tracking waste sold for fishmeal or other low-grade applications.

## 3. Technical Model Enhancements

### 3.1 Extended Ledger Model
*   **Transformation Ledger:** A new event type `inventory_transformation` that atomicly decrements input SKUs and increments output SKUs within a single transaction.
*   **Cost Basis Propagation:** Carrying the purchase price from the boat level through to the processed product for accurate COGS.

### 3.2 Role-Based UI (Factory Operator)
*   **Intake Screen:** Optimized for bulk receiving.
*   **Processing Batch Screen:** Input/Output weight capture.
*   **QC Lab Screen:** Capturing temperature, moisture, and grading results.
*   **Dispatch/Export Screen:** Generating PL (Packing Lists) and export invoices.

## 4. Inventory Flows
*   **Inter-Location Transfers:** Robust 2-phase commit for Hub-to-Hub or Hub-to-Export-Agent movements.
*   **Write-off Workflow:** Strict approval path for spoilage or inventory adjustments.

## 5. Financial Integration
*   **Factory AP:** Payment to processed-fish suppliers.
*   **Utility/OH Tracking:** Integration of factory operational expenses (Power, Ice, Labor) into the landed cost.
