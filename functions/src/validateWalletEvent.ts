import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

export const validateWalletEvent = functions.firestore
    .document("wallet_event_requests/{requestId}")
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
                    // Stale, allow retry
                }
            }
            lockTx.set(lockRef, { status: "RUNNING", timestamp: Date.now() });
        });

        const walletId = data.wallet_id;

        try {
            // 3. Main Transaction (Sequence & Ledger)
            await db.runTransaction(async (transaction) => {
                const walletStateRef = db.collection("wallet_states").doc(walletId);
                const walletStateDoc = await transaction.get(walletStateRef);

                let nextSequenceNumber = 1;
                let currentBalance = 0;

                if (walletStateDoc.exists) {
                    nextSequenceNumber = (walletStateDoc.data()?.sequence_number || 0) + 1;
                    currentBalance = walletStateDoc.data()?.current_balance || 0;
                }

                let delta = 0;
                switch (data.event_type) {
                    case "deposit":
                    case "transfer_received":
                    case "deposit_cash_handover":
                    case "revenue_cash":
                        delta = data.amount;
                        break;
                    case "expense":
                    case "expense_advance":
                    case "expense_trip":
                    case "expense_purchase":
                    case "transfer_initiated":
                        delta = -data.amount;
                        break;
                    case "trip_start":
                        delta = 0;
                        break;
                    default:
                        delta = 0;
                }

                if (data.wallet_type === "hub" && currentBalance + delta < 0) {
                    throw new Error("OVERDRAFT_BLOCKED: Hub wallets cannot fall below zero.");
                }

                // Create the wallet event inside transaction
                const eventRef = db.collection("wallet_events").doc(expectedHmac);
                transaction.set(eventRef, {
                    ...payloadData,
                    idempotency_key,
                    nonce,
                    sequence_number: nextSequenceNumber,
                    server_timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

                transaction.set(walletStateRef, {
                    wallet_id: walletId,
                    sequence_number: nextSequenceNumber,
                    current_balance: currentBalance + delta,
                    last_updated: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });

            // 4. Complete lock and remove request
            await lockRef.update({ status: "COMPLETED", timestamp: Date.now() });
            await snap.ref.delete();

        } catch (error: any) {
            if (error.message.includes("OVERDRAFT_BLOCKED")) {
                await lockRef.update({ status: "FAILED", error: error.message, timestamp: Date.now() });
                await snap.ref.delete();
            } else {
                await lockRef.update({ status: "FAILED", error: error.message, timestamp: Date.now() });
            }
            throw error;
        }
    });
