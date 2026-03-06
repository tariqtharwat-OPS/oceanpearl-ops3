import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

export const validateTransferEvent = functions.firestore
    .document("inventory_event_requests/{requestId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const requestId = context.params.requestId;

        if (!data) return;

        const HMAC_SECRET = process.env.HMAC_SECRET || "OPS3_PHASE0_DEV_SECRET";

        // 1. Validate payload integrity
        const { idempotency_key, nonce, ...payloadData } = data;
        const payloadString = JSON.stringify(payloadData);
        const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

        const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET)
            .update(payloadHash + (nonce || ""))
            .digest('hex');

        if (idempotency_key !== expectedHmac) {
            console.error(`HMAC validation failed. Replay attack or payload tampering detected.`);
            await snap.ref.delete();
            throw new Error(`Invalid HMAC sequence.`);
        }

        const db = admin.firestore();
        const lockRef = db.collection("idempotency_locks").doc(expectedHmac);

        // 2. Idempotency Lock (RUNNING)
        await db.runTransaction(async (lockTx) => {
            const lockDoc = await lockTx.get(lockRef);
            if (lockDoc.exists) {
                const lockData = lockDoc.data()!;
                if (lockData.status === "COMPLETED") {
                    throw new Error("IDEMPOTENCY_REJECT: Event already processed.");
                }
                if (lockData.status === "RUNNING") {
                    const elapsed = Date.now() - lockData.timestamp;
                    if (elapsed < 60000) {
                        throw new Error("IDEMPOTENCY_REJECT: Event currently running.");
                    }
                }
            }
            lockTx.set(lockRef, { status: "RUNNING", timestamp: Date.now() });
        });

        // 3. Two-Phase Transfer Logic Rules
        if (data.event_type === "transfer_initiated") {
            if (!data.origin_location_id || !data.destination_location_id) {
                await lockRef.update({ status: "FAILED", error: "Missing origin or destination", timestamp: Date.now() });
                await snap.ref.delete();
                throw new Error("Invalid transfer metadata: Missing origin or destination IDs.");
            }
        }
        else if (data.event_type === "transfer_received") {
            const dependentTransferId = data.transfer_id;

            if (!dependentTransferId) {
                await lockRef.update({ status: "FAILED", error: "No transfer_id", timestamp: Date.now() });
                await snap.ref.delete();
                throw new Error("Transfer received rejected: no parent transfer_id specified.");
            }

            const originEventRef = db.collection("inventory_events").doc(dependentTransferId);
            const originDoc = await originEventRef.get();

            if (!originDoc.exists || originDoc.data()?.event_type !== "transfer_initiated") {
                await lockRef.update({ status: "FAILED", error: "Parent missing or not initiated", timestamp: Date.now() });
                await snap.ref.delete();
                throw new Error("Transfer received rejected: Parent transfer initiated event not found.");
            }
        }
        else if (data.event_type === "transfer_cancelled") {
            const dependentTransferId = data.transfer_id;
            if (!dependentTransferId) {
                await lockRef.update({ status: "FAILED", error: "No transfer_id", timestamp: Date.now() });
                await snap.ref.delete();
                throw new Error("Transfer cancelled rejected: no parent transfer_id specified.");
            }

            const originEventRef = db.collection("inventory_events").doc(dependentTransferId);
            const originDoc = await originEventRef.get();

            if (!originDoc.exists) {
                await lockRef.update({ status: "FAILED", error: "Parent missing", timestamp: Date.now() });
                await snap.ref.delete();
                throw new Error("Transfer cancelled rejected: missing parent.");
            }
        }

        try {
            await db.runTransaction(async (transaction) => {
                // Determine correctly scoped sequence counter: location_id + unit_id + sku_id
                if (!data.location_id || !data.unit_id || !data.sku_id) {
                    throw new Error("Missing required scope variables: location_id, unit_id, sku_id");
                }
                const scopeId = `${data.location_id}__${data.unit_id}__${data.sku_id}`;

                const inventoryStateRef = db.collection("inventory_states").doc(scopeId);
                const stateDoc = await transaction.get(inventoryStateRef);
                let nextSequenceNumber = 1;
                let currentBalance = 0;

                if (stateDoc.exists) {
                    nextSequenceNumber = (stateDoc.data()?.sequence_number || 0) + 1;
                    currentBalance = stateDoc.data()?.current_balance || 0;
                }

                let delta = 0;
                if (data.event_type === "receive_own" || data.event_type === "receive_buy" || data.event_type === "transfer_received" || data.event_type === "transfer_cancelled") {
                    delta = data.amount;
                } else if (data.event_type === "transfer_initiated" || data.event_type === "sale_out" || data.event_type === "waste_out") {
                    delta = -data.amount;
                }

                if (currentBalance + delta < 0) {
                    throw new Error("STOCK_DEFICIT: Cannot drop below zero.");
                }

                // Create the inventory event inside the transaction
                const eventRef = db.collection("inventory_events").doc(expectedHmac);
                transaction.set(eventRef, {
                    ...payloadData,
                    idempotency_key,
                    nonce,
                    sequence_number: nextSequenceNumber,
                    server_timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

                // Update the state
                transaction.set(inventoryStateRef, {
                    location_id: data.location_id,
                    unit_id: data.unit_id,
                    sku_id: data.sku_id,
                    sequence_number: nextSequenceNumber,
                    current_balance: currentBalance + delta,
                    last_updated: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });

            // 4. Complete lock and remove request
            await lockRef.update({ status: "COMPLETED", timestamp: Date.now() });
            await snap.ref.delete();

        } catch (error: any) {
            await lockRef.update({ status: "FAILED", error: error.message, timestamp: Date.now() });
            throw error;
        }
    });
