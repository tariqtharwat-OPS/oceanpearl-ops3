# OPS3 PILOT ENVIRONMENT READINESS CHECKLIST

## 1. Firebase Project Verification
- [ ] Project ID: `oceanpearl-ops`
- [ ] Region: `asia-southeast1`
- [ ] Firebase Emulators (Local Testing): `127.0.0.1:8080/4000/5001/9099/9199/4400/4500`
- [ ] Firebase Hosting (Production): Deployed with correctly configured HMAC headers.

## 2. Secrets & Configs
- [ ] `HMAC_SECRET`: Configured in Cloud Functions environment (`functions.config()` or Secret Manager).
- [ ] `HMAC_ENFORCEMENT`: Verify `documentProcessor` fails if secret is missing.
- [ ] `control_config/default`: Seeded with pilot parameters (100c Tolerance, 10% Yield).

## 3. Firestore Indexes
- [ ] `documents`: (server_timestamp ASC).
- [ ] `inventory_events`: (server_timestamp ASC).
- [ ] `wallet_events`: (server_timestamp ASC).
- [ ] `payable_views`: (company_id, status, due_date).
- [ ] `receivable_views`: (company_id, status, due_date).
- [ ] `transfer_views`: (company_id, status, initiated_at).

## 4. Functions & Monitor
- [ ] `validateDocumentRequest`: Deployed and active in `asia-southeast1`.
- [ ] `ops3Monitor`: Scheduled to run every 30 minutes.
- [ ] `getTripProfit`: Secure callable deployed and accessible with valid auth.
- [ ] `v3Bootstrap`: One-time bootstrap flow tested and ready for completion.

## 5. Recovery & Troubleshooting
- [ ] `rebuild_projections.js`: Verified successful full reconstruction under load.
- [ ] `BACKUP_STRATEGY.md`: Scheduled daily exports verified in GCP Console.
