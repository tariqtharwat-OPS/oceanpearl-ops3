# OPS3 Security Model

## Deny-By-Default Foundation
All collections, documents, and storage buckets default to explicitly denying read and write operations.
A request must flawlessly thread a gauntlet of compound boolean checks evaluating authentication and authorization to succeed.

## Compound Scope Checks
Authorization relies on multi-dimensional JWT Custom Claims. A single rule does not grant access.
A user attempting a write must satisfy concurrent boundaries:
- **Company:** The top-level isolation tenant. `request.auth.token.companyId == resource.data.companyId`.
- **Location:** `request.auth.token.locationId == resource.data.locationId`.
- **Unit:** Specific vehicles/factories (e.g., `unitId` ensures Boat A cannot write to Boat B).
- **Trip/Session:** `tripId` must remain actively strictly open.

## Shark AI Privacy Rule
The "Shark AI" operates purely as a scoped proxy.
- **Inheritance:** Shark inherits the exact precision scope of the invoking user.
- **Raw Data Masking:** Shark must NEVER return raw operational data outside the user's scope.
- **Aggregated Insights:** Shark may return aggregated anonymized insights ("Yield averages across the fleet are 5% higher") but never specific identifiable records ("Boat B caught 500kg").

## Immutable Audit Trail Requirement
- Every security-sensitive action (Voiding, overriding, modifying privileges) MUST log to an append-only `system_audit` ledger.
- This ledger tracks `uid`, `timestamp`, `deviceId`, `ip`, and contextual `before/after` delta states.
- Posted documents and immutable event logs physically cannot be edited or deleted (`allow update, delete: if false;`).

## Advanced Threat Protections
- **Cross-Unit Leakage:** Compound checks negate the risk of Location Managers accessing adjacent Hub data.
- **Unauthorized Approval Transitions:** State changes (e.g. `transit` -> `received`) require the auth token to explicitly match the *Destination* location, preventing the Sender from spoofing receipt.
- **Forged Device Context:** Idempotency payloads bind metadata. The system strictly requires `eventId = HMAC(secret, payload_hash + nonce)`. Forged device timestamps are overwritten by Firestore's internal `request.time`.
- **Privilege Escalation via Inference:** Read rules block "list" queries that lack explicit indexed filters for the user's `locationId`, preventing pagination scraping behavior.
