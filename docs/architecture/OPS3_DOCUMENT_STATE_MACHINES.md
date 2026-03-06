# OPS3 Document State Machines

## Global Rules
- **What becomes locked after post:** All financial figures, quantities, timestamp, actor, entity linkages.
- **Contra / Void logic:** An immutable document cannot be edited. It must be countered with a `VoidEvent` (which zeroes its effect), followed by the creation of a replacement document.
- **Print behavior:** Drafts print with a watermark. Posted documents print as certified copies.

## Expense Voucher
- **States:** `draft` -> `posted` -> (`voided`)
- **Allowed transitions:** Boat Operator creates `draft`. Upon submitting to the local queue, transitions to `posted`.
- **Allowed actor by role:** Boat Operator, Office Admin, Finance.

## Receiving Own (Internal Catch)
- **States:** `draft` -> `posted` -> (`voided`)
- **Allowed transitions:** Unloads catch, records weights as `draft`. Finalizes receipt as `posted`.
- **Allowed actor by role:** Boat Operator, Factory Operator, Cold Storage Operator.

## Receiving Buy (External Purchase)
- **States:** `draft` -> `posted` -> (`voided`)
- **Allowed transitions:** Agrees on weight & price. Save as `draft`. Payment issues, turns `posted`.
- **Allowed actor by role:** Boat Operator, Factory Operator, Office Admin.

## Sales Invoice
- **States:** `draft` -> `posted` -> (`voided`)
- **Allowed transitions:** Selects customer, creates line items (`draft`). Commits stock reduction and AR/Cash (`posted`).
- **Allowed actor by role:** Boat Operator, Cold Storage Operator, Office Admin.

## Transfer Manifest
- **States:** `draft` -> `transit` -> `received` -> (`voided`)
- **Allowed transitions:** Sender creates (`draft`). Sender dispatches (`transit`). Receiver accepts (`received`).
- **Allowed actor by role:**
  - Sender: Boat Operator, Factory Operator.
  - Receiver: Factory Operator, Cold Storage Operator.

## Processing Batch
- **States:** `draft` -> `in_progress` -> `completed` -> (`voided`)
- **Allowed transitions:** Factory defines input (`draft`). Begins cutting (`in_progress`). Finalizes output/yield (`completed`).
- **Allowed actor by role:** Factory Operator.

## Session Close
- **States:** `open` -> `reconciling` -> `closed`
- **Allowed transitions:** Trip starts (`open`). Operator forces sync and checks errors (`reconciling`). Final submit locks session (`closed`).
- **Allowed actor by role:** Boat Operator, Location Manager.
