# OPS3 Security Model

## Deny-By-Default Foundation
All collections, documents, and storage buckets default to explicitly denying read and write operations.
A request must perfectly thread a gauntlet of boolean checks evaluating authentication and authorization claims to succeed.

## Role Scope Inheritance
Authorization is governed by Custom Claims injected into the user's JWT at the authentication phase.
Scopes are heavily localized.
- `role: boat_operator` can exclusively read/write documents where `hubId` or `tripId` map to their explicit assignments.
- `role: finance` possesses read access across assigned hubs, but restricted write capabilities.
- `role: sysadmin` bypasses normal operational checks.

## Company/Location/Unit Boundaries
- **Company:** The top-level isolation tenant. `companyId` is an absolute boundary. Users from Company A cannot retrieve documents from Company B regardless of role privileges.
- **Location:** Operational boundary (Hubs). `locationId` binds Boat Operators, Managers, and Cold Storage staff.
- **Unit:** Specific vehicles/factories. `unitId` ensures a Boat Operator on Boat X cannot post an expense for Boat Y.

## Shark AI Scope Inheritance
The "Shark AI" functions on a passthrough authorization model. It exclusively inherits the exact read scope of the user querying it.
- **Example:** A `location_manager` asking Shark for an anomaly report will strictly receive anomalies concerning their precise location assignment. Shark possesses no omnipotent bypass.

## Immutable Event Protection
- Security rules enforce that `InventoryEvent` and `WalletEvent` collections strictly allow `.create`.
- Any `.update` or `.delete` request explicitly fails with `PERMISSION_DENIED`.

## Posted Document Protection
- Documents stamped with `status == 'posted'` freeze specific fields (amounts, items, user IDs).
- Rules validate `request.resource.data.totalAmount == resource.data.totalAmount`, enforcing immutability on critical structures.
