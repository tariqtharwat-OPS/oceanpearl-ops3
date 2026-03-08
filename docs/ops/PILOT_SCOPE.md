# OPS3 PILOT SCOPE DEFINITION

## 1. Pilot Locations
- **HUB-01**: Central Hub (Main Intake & Distribution)
- **FAC-01**: Primary Processing Factory (Industrial Line A)
- **CS-01**: Cold Storage Facility (Finished Goods Warehouse)

## 2. Pilot Boats
- **B-OCEAN-01**: Master Boat (Small-Medium Purse Seiner)
- **B-PEARL-02**: Secondary Boat (Artisanal Handline)

## 3. Pilot Units
- **hub_intake**: HUB-01 Intake Station
- **factory_processing**: FAC-01 Line A
- **wip_storage**: FAC-01 Internal WIP
- **finished_goods**: FAC-01 Finished Goods Zone
- **cold_storage**: CS-01 Main Freezer

## 4. Pilot User Roles
- **ceo**: Full company visibility, configuration rights.
- **hq_analyst**: Analytics visibility, alert monitoring.
- **boat_operator**: Trip start, expenses, buys, sales, wallet management, trip closure.
- **factory_operator**: Processing batch start, transformations, WIP movement.
- **location_manager**: Hub receiving, inter-location transfers, local stock visibility.
- **finance_officer**: Settlement verification, payable/receivable management.

## 5. Pilot SKUs (Products)
- **raw-tuna**: Raw whole tuna from boat.
- **tuna-loin**: Value-added processed loin.
- **tuna-waste**: Processing byproduct (for byproduct market).
- **ice**: Operational consumable.
- **fuel**: Operational consumable.

## 6. In-Scope vs Out-of-Scope
### In-Scope
- End-to-end Boat Trip Lifecycle.
- Hub Receipt and Factory Processing throughput.
- Sharded Financial Projections & Profitability.
- Automated Lineage Inheritance (Boat -> Hub -> Factory).
- Config-driven Operational Controls (Yield, Aging, Tolerance).

### Out-of-Scope
- Automated Payroll (Pilot will use manual settlement reports).
- Export Logistics (International shipping documents).
- Multi-currency support (Fixed to Primary Currency).
- Real-time IoT Sensor Integration (Pilot uses manual entry).
