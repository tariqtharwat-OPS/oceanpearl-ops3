# UI FREEZE CHECKLIST (CONTRACT LOCK v1)

## RULE: STRICT UI VERSIONING
Any future UI change requires a new version tag and an entry in the changelog. The UI blueprint is now the immutable source of truth for the system's interactive constraints.

## 1. Approved Role Dashboards & Screens
- [x] **Boat Operator:** Start Trip, Opening Balances, Expense Invoice, Receiving (Own), Receiving (Buy), Sales Invoice, Trip Wallet, Close Trip
- [x] **Factory Operator:** Start Shift, Opening Checks, Expense, Inbound Receiving, Processing Batch, Internal Transfer, Wallet Snapshot, Close Shift
- [x] **Cold Storage Operator:** Start Loading, Opening Checks, Expense, Inbound Acceptance, Stock On Hand, Outbound Loading, Sales Invoice, Damage Log, Wallet Snapshot, Close Session
- [x] **Office Admin:** Start Day, Petty Cash, Expense, Payment Reqs, AR Log, Close Day Summary
- [x] **Location Manager:** Dashboard, Approvals (Expenses/Transfers/Receiving), Unit Performance, Location Inventory, Wallets, Staff Assignment, People Registry
- [x] **Finance Officer:** Dashboard, Wallets Overview, AP/Payment Run, AR/Collection, Crew Advances OS, Global Ledger, Bank Recon, Policy Monitor
- [x] **CEO Command:** Executive Pulse, Global Inventory Map, Yield Anomalies, Financial Health, Risk Dashboard, Approvals
- [x] **Investor:** Dashboard, Valuation, Revenue/Margin, Risk Summary
- [x] **System Admin:** User Management, Location Tree, People Master, Expense Type Master, Master Data, Audit Log, Permissions, Settings
- [x] **Shark AI:** Ops Console Chat, Risk Monitor Grid, Alert History, WhatsApp Templates, Rule Configuration

## 2. Approved Invoice-Grade Documents & Print Layouts
- [x] Receiving Invoice & A4 Header/QR Placeholder
- [x] Expense Voucher & A4 Header/QR Placeholder
- [x] Sales Invoice & A4 Header/QR Placeholder
- [x] Processing Batch Form & A4 Header/QR Placeholder
- [x] Outbound Transfer Manifest (DO) & A4 Header/QR Placeholder
- [x] Session Closure Audit Sheet & A4 Header/QR Placeholder

## 3. Approved Session Workflows
- [x] **Start Session:** Initialize Context Bounds, Validate Staff Registry
- [x] **Initial Balances:** Record Cash Handover, Disburse Crew Advances
- [x] **Document Execution:** Perform localized receipts, expenditures, batches, and dispatches
- [x] **Validation View:** Derived Wallet and Derived Stock Snapshot readouts
- [x] **Close Session:** Zero-out Crew Settlements, Transfer Remaining Float, Lock State

## 4. Pending Items
- [ ] *None explicitly pending at this freeze level.*
