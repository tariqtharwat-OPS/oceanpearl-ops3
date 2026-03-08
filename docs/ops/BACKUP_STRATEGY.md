# OPS3 — BACKUP & RECOVERY STRATEGY

## 1. Objective
Ensure 100% data durability and business continuity for industrial seafood operations.

## 2. Backup Schedule
| Target | Method | Frequency | Retention |
|---|---|---|---|
| **Firestore Database** | GCP Scheduled Managed Export | Every 24 Hours | 30 Days |
| **Cloud Functions** | Git Integrated CI/CD | On Each Commit | Infinite (Git History) |
| **Client Secrets** | Google Cloud Secret Manager | Managed | N/A |

## 3. Recovery Procedures (RTO < 4 Hours)
In case of catastrophic data loss:

### A. Managed Firestore Import
1. Navigate to Google Cloud Console > Firestore > Import/Export.
2. Select the latest export from the `ops3-backups-bucket`.
3. Perform a full or collection-level import.

### B. Ledger Replay (Point-in-Time Recovery)
Since OPS3 follows an immutable document ledger pattern, projections can be rebuilt from the source of truth if a read-model becomes corrupted:
```bash
node scripts/rebuild_projections.js
```

## 4. Disaster Recovery Scenarios
- **Projection Corruption**: Use `rebuild_projections.js` to restore stock and performance views from the `documents` and `inventory_events` collections.
- **Accidental Deletion**: Use Firestore Managed Import for specific collections.
- **Region Outage**: Cold-standby deployment in an alternative GCP region (e.g., `asia-northeast1`) using the Backup bucket.

## 5. Integrity Verification
Monthly integrity audits are performed by running the `test_phase7_stress.js` script against a non-production clone to verify that all transactional invariants remain enforced under load.
