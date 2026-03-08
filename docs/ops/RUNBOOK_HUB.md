# OPS3 HUB RECEIVE RUNBOOK

## 1. Landing Verification
- [ ] Confirm Boat Trip status is `closed`.
- [ ] Inspect quality grade.
- [ ] Weigh landed product units (Landed Weight vs Estimated Weight).

## 2. Inventory Intake
- [ ] ACTION: Hub Receive Document (`hub_receive_from_boat`).
- [ ] Logic: This document triggers `receive_own` at Hub storage.
- [ ] Verify: `stock_views` at HUB-01 for `raw-tuna`.

## 3. Storage Assignment
- [ ] Assign batch ID (`lineage.batch_id`).
- [ ] Move to Cooler (`transfer_interlocation` Hub Storage -> Cooler Storage).
