# OPS3 QR Document Signing Specification

## Context
OPS3 represents a digital-first operational system forced to operate securely across physical and paper-bound environments (fishing vessels, factory docks, warehouse gates). Bridging the gap between physical custody handovers and digital transactional integrity is managed exclusively via immutable **QR Reference Markers**.

---

## 1. Encoded Information (QR Payload)

A printed QR code explicitly acts as a highly constrained pointer to the digital origin. It is not an arbitrary string; it is a cryptographically signed payload.

**Minimum Payload Vector:**
- **System Version:** `OPS-v1`
- **Document UUID:** `doc_89fa21bc90a` (The exact Firestore `document` record identifier)
- **Primary Type Hash:** `type: DO_TRANSFER` (Or `RECEIVING`, `EXPENSE_VOUCHER`)
- **Originating Unit ID:** `unit: Kaimana_Fac_Main`
- **Cryptographic Hash (SHA-256 Segment):** `hash: a8f9c2...`
  - *The hash mathematically sums the critical variables generated at Post time (e.g., Quantity = 45.0, SKU = Snapper Fillet A, Time = 14:00Z).*

---

## 2. Referencing the Digital Record

The printed A4 paper physically transitions between actors (e.g., a Factory Mandor handing a printed Transfer Document to the Cold Storage Gatekeeper). 

**The Digital Link:**
The paper inherently bears the static data produced at execution. The Cold Storage Gatekeeper physically receives the printed DO. The physical gatekeeper uses the mobile OPS3 app to scan the printed QR marker.

---

## 3. Application Verification Process

Upon scanning the physical sheet, the app executes a deterministic set of logic bounds strictly mapped offline/online:

**Online Validation:**
1. The app parses the `Document UUID`.
2. It fetches the exact `documents` record dynamically from Firestore.
3. The app juxtaposes the fetched record values (e.g., *Is the document still flagged active? Was it voided remotely?*) directly against the screen.
4. The Gatekeeper accepts the system-verified transfer via the UI, instantly writing a new `documents` acceptance line acknowledging the exact `Document UUID` passed in the QR payload.

**Offline Validation:**
1. The app parses the `Hash`.
2. Even entirely offline, the app recalculates the mathematical hash of the printed numbers on the physical ledger. 
3. If the paper says *120 KG* but the cryptographic hash resolves that the digital document was strictly bound to *45 KG*, the offline app throws an immediate, hard-breaking "TAMPER WARNING" alerting the user to physically reject the handover.

---

## 4. Tampering Detection & Asymmetric Security

Since field workers occasionally manipulate physical paper records post-printing (crossing out a 45.0 KG and writing 60.0 KG manually) to fraudulently cover stock variances, OPS3 mathematically rejects any changes to physical variables unmapped to digital states.

**Tampering Identification Vectors:**
- **Variable Mutation:** Any physical modification to the printed paper simply breaks the offline hash generation constraints. 
- **Void Recognition:** If an Office Admin "Voids" a printed Receiving Invoice on the backend, any attempt to scan the printed QR instantly pulls the `status = voided` flag, freezing the UI workflow and preventing the physical dock from acting on the dead paper trail. 
- **Double-Scan Rejection:** QR hashes are inherently bound to one-way workflows. A Cold Storage Gatekeeper cannot scan an "Incoming Transfer DO" twice. The application flags the `Document UUID` as resolved upon the first acceptance event, creating a native double-spend denial lock.
