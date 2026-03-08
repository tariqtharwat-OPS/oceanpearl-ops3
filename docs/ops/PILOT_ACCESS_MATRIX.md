# OPS3 PILOT ACCESS MATRIX

| Role | Visibility (Read) | Capability (Write/Action) | Custom Claims Required |
|---|---|---|---|
| **CEO** | Full Company-wide Analytics, Configs, Alerts. | Can POST any document types. | `role: "ceo", company_id: "CO-1"` |
| **HQ Analyst** | Full Company-wide Analytics & Alerts. | Read-only. | `role: "hq_analyst", company_id: "CO-1"` |
| **Location Manager** | Full Location Inventory & Transfers. | Hub receiving, inter-location moves. | `role: "loc_mgr", company_id: "CO-1", location_id: "LOC-1"` |
| **Boat Operator** | Unit-level Inventory, Wallet, Expenses. | Boat receipts, wallet transfers, closure. | `role: "boat_op", company_id: "CO-1", location_id: "LOC-1", unit_id: "B-1"` |
| **Factory Operator** | Unit-level Processing Lines and WIP. | Processing batch start/movement/finish. | `role: "fact_op", company_id: "CO-1", location_id: "LOC-1", unit_id: "FAC-1"` |
| **Finance Officer** | Payables, Receivables, Settlements. | Settlement verification, payment tracking. | `role: "finance", company_id: "CO-1"` |

## Custom Claims Payload Template
```json
{
  "company_id": "Ocean-Pearl-SC",
  "location_id": "HUB-01",
  "unit_id": "B-OCEAN-01",
  "role": "boat_op"
}
```

## Matrix Enforcement Logic
- **`matchesRoleScope(data)`**: HQ roles bypass `location_id` and `unit_id` check.
- **`isHQReader()`**: Only Analyst, CEO, and Admin can read sharded financial views.
- **`getTripProfit`**: Callable restricts unit-level users from seeing other vessel profits.
