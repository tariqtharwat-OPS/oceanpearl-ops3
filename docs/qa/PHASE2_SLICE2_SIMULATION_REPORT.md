# PHASE 2 SLICE 2 — SIMULATION REPORT

## 1. Objective
Verify multi-boat, multi-factory, and multi-location operational flows with staged factory movement and unified stock visibility.

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
| 7 | Unified Stock View Report | ✅ SUCCESS |

## 4. Evidence: Stock Distribution
| Location | Unit | Unit Type | SKU | Qty |
|---|---|---|---|---|
| Kaimana | Factory-Finished-KM | factory_finished | snapper-fillet | 40 |
| Kaimana | Factory-Proc-KM | factory_processing | organic-waste | 150 |
| Kaimana | Factory-Proc-KM | factory_processing | snapper-roe | 10 |
| Kaimana | Hub-Intake-KM | hub_intake | grouper-whole | 200 |
| Sorong | ColdStore-SR | cold_storage | snapper-fillet | 100 |

## 5. Persistence Profile
All `inventory_states` now correctly include the `unit_type` field, allowing for high-level filtering by industrial stage across multiple locations.
