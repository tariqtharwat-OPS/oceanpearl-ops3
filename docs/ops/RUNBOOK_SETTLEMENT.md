# OPS3 FINANCIAL SETTLEMENT RUNBOOK

## 1. Settlement Verification
- [ ] Check `settlement_views` for closed Boat Trip.
- [ ] Audit Revenue v Expenses.
- [ ] Compare `total_profit` with `Hub-Global` wallet delta.

## 2. Supplier Payables
- [ ] Check `payable_views` status `pending`.
- [ ] Align with `receive_buy` documentation.
- [ ] Batch Payment Processing.
- [ ] ACTION: Record Payment Document (`payment_payable`).
- [ ] Verify: Payable status set to `settled`.

## 3. Customer Receivables
- [ ] Check `receivable_views` status `pending`.
- [ ] Align with `sale_out` documentation.
- [ ] Record Collections from Customer.
- [ ] ACTION: Record Payment Document (`payment_receivable`).
- [ ] Verify: Receivable status set to `settled`.
