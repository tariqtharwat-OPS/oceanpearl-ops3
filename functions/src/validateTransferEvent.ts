import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const validateTransferEvent = functions.firestore
    .document("inventory_events/{eventId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const eventId = context.params.eventId;

        if (!data) return;

        const db = admin.firestore();

        // 1. Two-Phase Transfer Logic Rules
        // Ensure destination does not increase until transfer_received
        if (data.event_type === "transfer_initiated") {
            // Origin stock strictly decreases. Transit Stock increases (handled via derived views)
            if (!data.origin_location_id || !data.destination_location_id) {
                await snap.ref.delete();
                throw new Error("Invalid transfer metadata: Missing origin or destination IDs.");
            }
        }
        else if (data.event_type === "transfer_received") {
            // Destination stock increases ONLY if matched to a prior initiated transfer ID
            const dependentTransferId = data.transfer_id;

            if (!dependentTransferId) {
                await snap.ref.delete();
                throw new Error("Transfer received rejected: no parent transfer_id specified.");
            }

            const originEventRef = db.collection("inventory_events").doc(dependentTransferId);
            const originDoc = await originEventRef.get();

            if (!originDoc.exists || originDoc.data()?.event_type !== "transfer_initiated") {
                await snap.ref.delete();
                throw new Error("Transfer received rejected: Parent transfer initiated event not found.");
            }

            // Verify Auth Token claims destination location (cannot spoof receipt)
            // Note: Firebase context auth is unavailable in standard onCreate trigger outside Callable functions.
            // But we enforced this in Firestore Rules: destination matched request.auth.token.locationId
            // The Cloud Function is a secondary validator.
        }
        else if (data.event_type === "transfer_cancelled") {
            // Reverses the transit state. Stock returns to origin.
            const dependentTransferId = data.transfer_id;
            if (!dependentTransferId) {
                await snap.ref.delete();
                throw new Error("Transfer cancelled rejected: no parent transfer_id specified.");
            }

            const originEventRef = db.collection("inventory_events").doc(dependentTransferId);
            const originDoc = await originEventRef.get();

            if (!originDoc.exists) {
                await snap.ref.delete();
                throw new Error("Transfer cancelled rejected: missing parent.");
            }
        }

        // Assign server sequence identically
        await db.runTransaction(async (transaction) => {
            const inventoryStateRef = db.collection("inventory_states").doc(data.unit_id);
            const stateDoc = await transaction.get(inventoryStateRef);
            let nextSequenceNumber = 1;

            if (stateDoc.exists) {
                nextSequenceNumber = (stateDoc.data()?.sequence_number || 0) + 1;
            }

            transaction.update(snap.ref, { sequence_number: nextSequenceNumber });

            transaction.set(inventoryStateRef, {
                unit_id: data.unit_id,
                sequence_number: nextSequenceNumber,
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
    });
