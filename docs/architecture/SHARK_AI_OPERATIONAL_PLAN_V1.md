# Shark AI Operational Plan (v1)

Shark is integrated natively into the OPS3 framework as an aggressive monitoring, anomaly-detecting, and advisory assistant. It is strictly scoped and governed by data privacy bounds.

## 1. Shark Monitoring Layers
1. **Real-Time Rule Layer:** Executes inline with sync operations. Flags critical fast-track anomalies (e.g., negative yield computation, impossible transaction volume based on history).
2. **Scheduled Analytics Layer:** Overnight cron job reviewing trailing 24h data. Surfaces trend deviations (e.g., Captain A spent 30% more on fuel than fleet average on Route B).
3. **Predictive Layer:** Uses historical flow to predict impending float shortages or spoilage risks based on aged cold storage data.

## 2. Operational Signals
Shark is tuned to actively watch:
- **Yield Anomalies:** Batch Input * X multiplier != Expected Output mathematically.
- **Suspicious Expenses:** Spikes in fuel or maintenance costs disconnected from engine hours or catch volume.
- **Inventory Discrepancies:** Frequent `physical_count` adjustments at a specific hub implying theft or poor management.
- **Wallet Irregularities:** Excessive cash advances or frequent overdraft conversions.
- **Fraud Indicators:** Repeated document voids, excessive backdating attempts.
- **Sync Failures:** Identifying systemic hardware/network issues on specific boats based on stalled queues.

## 3. Role-Specific Behavior
- **Boat Operator:** Shark provides predictive warnings ("You are approaching your typical fuel limit for this distance" or "Careful, expected yield on Grade A fish drops if temp exceeds X").
- **Location Manager:** Shark identifies unit-level inefficiencies ("Boat 3 is underperforming on catch-to-expense ratio this month").
- **Finance:** Shark identifies ledger aberrations ("Hub B is accumulating excessive unaccounted advances").
- **CEO:** Strategic brief ("Global margins dropped 2% primarily driven by yield inconsistencies at Factory C").

## 4. Alert Design
- **Severity Levels:** INFO, WARNING, CRITICAL, FRAUD_FLAG.
- **Channels:** In-app Notification Center (Standard), WhatsApp API (CRITICAL offline reach), Email (Summary Digests).
- **Escalation Logic:** An unacknowledged Warning becomes a Critical alert escalated to the direct supervisor after 24h.

## 5. Scope and Privacy Controls
- **Inheritance:** Shark executes queries enforcing the exact location/company ID custom claims of the requesting user.
- **No Raw Data Exposure:** Shark prevents cross-scope hallucination by executing in sandboxed multi-tenant Cloud Functions. The LLM is NEVER given the raw, unfiltered firestore context. It is given pre-filtered JSON subsets.
- **Audit Trail:** Every interaction, warning generated, and user acknowledgment of a Shark advisory is appended to the `system_audit` log.

## 6. Near-Term Shark Features (Phase 1 & 2 Fit)
Implementable directly out of the box using structured few-shot prompting and standard Cloud Functions:
- **Expense Range Warnings:** Real-time flag comparing current expense input against trailing 30-day average for that Boat.
- **Yield Deviation Warnings:** Flags mathematically improbable batch processing outcomes.
- **Sync-Health Warnings:** Dashboard highlight if a boat has been active but offline > 48 hours.
- **Duplicate Pattern Detection:** Highlights structurally similar expenses (amount + vendor) across different trips that bypassed standard idempotency (where `eventId = HMAC(secret, payload_hash + nonce)` was properly applied but the user physically performed a double entry).
