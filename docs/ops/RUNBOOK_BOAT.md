# OPS3 BOAT RUNBOOK

## 1. Starting Trip
- [ ] Check fuel, ice, and bait.
- [ ] Wallet Balance: Ensure hub starting cash is received (`Hub-Global -> Boat-Wallet`).
- [ ] ACTION: Start Trip document (`trip_status: open`).

## 2. Ocean Ops (During Trip)
- [ ] All Fish Purchases: Record `receive_buy` and `payment_made`.
- [ ] Expenses: Record `expense_trip` for fuel/provisions.
- [ ] Inventory: Check `stock_views` for boat-side storage.

## 3. Ending Trip
- [ ] Offload at Hub: All raw fish transferred (`transfer_interlocation`).
- [ ] Settle with Hub: Any remaining boat cash transferred back to hub (`Hub-Global`).
- [ ] Final ACTION: Record `trip_closure` document.
- [ ] Verify: Trip status must be `closed`.
