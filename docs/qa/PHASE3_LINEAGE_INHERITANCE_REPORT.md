# PHASE 3 — LINEAGE INHERITANCE REPORT

## 1. Objective
Automate the propagation of traceability data (Lineage) across the supply chain to eliminate manual data entry errors at industrial stages.

## 2. Inheritance Chain Verified
The system was tested through the following path, with automatic property propagation at every `->` step:

**Boat Trip (T-100)** 
-> **Hub Receive** (Inherits `trip_id`)
-> **Factory Processing** (Inherits `trip_id`, defines `batch_id`)
-> **WIP Movement** (Inherits `trip_id` + `batch_id`)
-> **Finished Goods** (Inherits `trip_id` + `batch_id`)
-> **Cold Storage Transfer** (Inherits full lineage across locations)

## 3. Server-Side Derivation Logic
Lineage is now derived in `documentProcessor.js` by looking up the `source_document_id`. 
The following fields are automatically managed:
- `trip_id`
- `batch_id`
- `origin_location_id`
- `origin_unit_id`
- `source_receiving_doc`

## 4. Evidence
- **Verification Script**: `scripts/test_phase3_visibility.js`
- **Result**: Stage 5 confirmed that finished goods in Sorong still pointed to Trip T-100 and Batch BATCH-001 without the client providing those IDs in the final transfer request.
