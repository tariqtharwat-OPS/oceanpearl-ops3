# PHASE 3 — LINEAGE DERIVATION REPORT

## 1. Objective
Automate the propagation of traceability data (Lineage) across the supply chain. This minimizes manual data entry at industrial stages by deriving deep property chains from selected source documents.

## 2. Derivation Chain (Semi-Automatic)
The system propagates properties at every `->` step based on a **client-selected** source:

**Boat Trip (T-100)** 
-> **Hub Receive** (Inherits `trip_id` from Trip or Source Doc)
-> **Factory Processing** (Inherits `trip_id`, defines `batch_id`)
-> **WIP Movement** (Inherits `trip_id` + `batch_id` from Source Batch Doc)
-> **Finished Goods** (Inherits `trip_id` + `batch_id` from Source WIP Doc)
-> **Cold Storage Transfer** (Inherits full lineage across locations)

## 3. Server-Side Derivation Logic
Lineage is derived in `documentProcessor.js` whenever a `source_document_id` or `source_receiving_doc` is provided. The backend automatically fills and persists:
- `trip_id`
- `batch_id`
- `origin_location_id`
- `origin_unit_id`
- `source_receiving_doc`

Selection of the `source_document_id` remains a client-side requirement to ensure the operator is moving the correct physical batch.

## 4. Evidence
- **Verification Script**: `scripts/test_phase3_visibility.js`
- **Result**: Confirmed that once a `source_document_id` is linked, the backend successfully populates all recursive lineage fields into `inventory_events` and `stock_batch_views`.
