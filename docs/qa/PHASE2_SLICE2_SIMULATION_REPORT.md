# PHASE 2 SLICE 2 — SIMULATION REPORT

## 1. Objective
Verify multi-boat, multi-factory, and multi-location operational flows with staged factory movement and unified stock visibility via read-model projections.

## 2. Test Environment
- **Project ID**: `oceanpearl-ops`
- **Emulator**: Firestore + Cloud Functions
- **Test Script**: `scripts/test_integrated_slice2.js`

## 3. Scenario Execution
| Stage | Description | Result |
|---|---|---|
| 1 | Multiple boat landings (Boat A & B) in Kaimana | ✅ SUCCESS |
| 1 | Trip closure for both boats | ✅ SUCCESS |
| 2 | Hub Consolidated Receive (landing dock) | ✅ SUCCESS |
| 3 | Hub → Factory Processing unit movement | ✅ SUCCESS |
| 4 | Snapper Batch Transformation (300kg -> Fillet/Roe/Waste) | ✅ SUCCESS |
| 5 | Staged Movement: Processing → WIP → Finished Goods | ✅ SUCCESS |
| 6 | Inter-Location Transfer: Kaimana → Sorong Cold Storage | ✅ SUCCESS |
| 7 | Unified Stock View Report (Projected via stock_views) | ✅ SUCCESS |

## 4. Evidence: Stock Distribution (Projected via stock_views)
| Location | Unit | SKU | Qty | Avg Cost |
|---|---|---|---|---|
| Kaimana | Factory-Finished-KM | snapper-fillet | 40 | 40000 |
| Kaimana | Factory-Proc-KM | organic-waste | 150 | 40000 |
| Kaimana | Factory-Proc-KM | snapper-roe | 10 | 40000 |
| Kaimana | Hub-Intake-KM | grouper-whole | 200 | 60000 |
| Sorong | ColdStore-SR | snapper-fillet | 100 | 40000 |

## 5. Persistence Profile
- **inventory_states**: Pure ledger projection (balance/cost only). `unit_type` removed to maintain architecture purity.
- **stock_views**: High-performance dashboard projection containing `company_id` and standardized `qty` fields.
- **units**: External source of truth for `unit_type`.
