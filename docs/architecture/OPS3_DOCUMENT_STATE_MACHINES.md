# OPS3 Document State Machines

## Global Rules
- **Immutability:** A document stamped `posted` locks its financial figures, quantities, timestamp, actor, and entity linkages.
- **Dependency Cascade Policy:** A document **cannot** be voided if downstream documents depend on it (e.g. Catch Receipt -> Processing Batch), unless the downstream documents are recursively voided in reverse chronological order via explicit Contra-Events.
- **Print behavior:** Drafts print with a watermark ("UNSYNCED DRAFT"). Posted documents print as certified copies.

## Expense Voucher
- **States:** `draft` -> `posted` -> (`voided` / `error`)
- **Allowed transitions:** Operator creates `draft`. Sync issues `posted`. If cloud validation fails, sets to `error` for manual intervention.

## Receiving Own (Internal Catch)
- **States:** `draft` -> `posted` -> (`voided` / `rejected`)
- **Allowed transitions:** Unloads catch, records weights as `draft`. Finalizes receipt as `posted`. Quality control can trigger `rejected` state before post.

## Receiving Buy (External Purchase)
- **States:** `draft` -> `posted` -> (`voided` / `rejected`)
- **Allowed transitions:** Agrees on weight & price (`draft`). If goods fail inspection, `rejected`. Payment clears, `posted`.

## Sales Invoice
- **States:** `draft` -> `posted` -> (`cancelled` / `voided`)
- **Allowed transitions:** Selecting customer/price (`draft`). If customer backs out before post, `cancelled`. Sale commits (`posted`). 

## Transfer Manifest
- **States:** `draft` -> `transit` -> `received` -> (`cancelled` / `expired` / `voided`)
- **Allowed transitions:** 
  - Sender creates (`draft`). 
  - Sender dispatches (`transit`). 
  - Receiver rejects physically at door (`cancelled`), stock returns to sender.
  - Time elapsed beyond SLA (`expired`), flags for audit.
  - Receiver accepts (`received`).

## Processing Batch
- **States:** `draft` -> `in_progress` -> `paused` -> `completed` -> (`error` / `voided`)
- **Allowed transitions:** Factory defines input (`draft`). Begins cutting (`in_progress`). Machine breakdown or shift end (`paused`). Resumes (`in_progress`). Finalizes output/yield (`completed`). Yield mathematically impossible triggers `error` queue.

## Session Close
- **States:** `open` -> `reconciling` -> `closed` -> (`reopened`)
- **Allowed transitions:** Trip starts (`open`). Operator checks errors (`reconciling`). Final submit locks session (`closed`). 
- **Reopen Policy:** Extremely strict. `reopened` state is only accessible via CEO/Admin cryptographic override to correct severe foundational anomalies. Reopening immediately invalidates subsequent downstream reports until re-closed.
