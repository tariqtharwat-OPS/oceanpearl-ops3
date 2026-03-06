# OPS3 Enhancements Backlog (v1)

This backlog outlines industry-fit enhancements aligned with the current architectural scope. They are categorized by prioritization timeline.

## A) Seafood / Operations
- **Batch Traceability**
  - *Why:* Critical for export compliance, FDA standards, and recall management.
  - *Where:* `InventoryEvent` and `Processing Batch` documents.
  - *When:* NOW (Phase 1/2 integration).
- **Quality Grading**
  - *Why:* Seafood pricing is highly volatile based on grade.
  - *Where:* `Receiving` and `Processing` documents.
  - *When:* NOW.
- **Vessel Fuel + Engine-hours Analytics**
  - *Why:* Core KPI for Boat profitability and Shark AI anomaly detection.
  - *Where:* `Expense Voucher` (Fuel sub-category).
  - *When:* PHASE 1.5.
- **Yield Benchmarking**
  - *Why:* Allows Factory to track efficiency against historical expected output.
  - *Where:* `Processing Batch` closure.
  - *When:* PHASE 2.
- **Physical Stock Count Workflow**
  - *Why:* Reconciles computed immutable ledgers with reality.
  - *Where:* `physical_count` events.
  - *When:* PHASE 2.
- **Structured Adjustment Reasons**
  - *Why:* Prevents blank "admin fixes" by requiring audit codes (Spoilage, Dehydration, Theft).
  - *Where:* `adjustment_reason_code` events.
  - *When:* PHASE 2.
- **Export/Compliance-ready Print Layouts**
  - *Why:* Customs requires specific metadata formatting.
  - *Where:* Print Templates.
  - *When:* LATER.

## B) Operator Usability
- **Offline Print Queue with Unsynced Watermark**
  - *Why:* Provides non-repudiation while acknowledging pending state.
  - *Where:* Printer service worker.
  - *When:* NOW.
- **Contextual Help Overlays**
  - *Why:* Lowers training overhead for non-technical Boat staff.
  - *Where:* UI generic hook context.
  - *When:* LATER.
- **Optional Voice-Assisted Entry**
  - *Why:* Wet hands on boats make typing difficult. NLP parses "Received 50 kilos tuna".
  - *Where:* Specific input forms.
  - *When:* LATER.
- **Sync Status Visibility**
  - *Why:* Operators need absolute confidence on when it is safe to turn off iPad.
  - *Where:* Global NavBar Header.
  - *When:* NOW.

## C) Management Visibility
- **Daily Digest for Managers**
  - *Why:* Push-based asynchronous updates reduce dashboard fatigue.
  - *Where:* Cloud Functions cron job.
  - *When:* PHASE 3.
- **Predictive Cash Position**
  - *Why:* Helps Hub Master ensure sufficient float for incoming boats based on active trip durations.
  - *Where:* Analytics layer.
  - *When:* PHASE 3.
- **Reconciliation Dashboards**
  - *Why:* Rapid unblocking of failed/stuck offline queues.
  - *Where:* Office Admin / Finance UI.
  - *When:* PHASE 2.
