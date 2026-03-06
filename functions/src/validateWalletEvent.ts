import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const HMAC_SECRET = "OPS3_PHASE0_DEV_SECRET"; // In prod, pull from Secret Manager

export const validateWalletEvent = functions.firestore
    .document("wallet_events/{eventId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const eventId = context.params.eventId;

        if (!data) return;

        // 1. Validate payload integrity: eventId = HMAC(secret, payload_hash + nonce)
        // Assume idempotency_key is passed in data for debug, and should match eventId
        const { idempotency_key, nonce, ...payloadData } = data;
        const payloadString = JSON.stringify(payloadData);
        const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');
        
        const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET)
            .update(payloadHash + (nonce || ""))
            .digest('hex');

        if (idempotency_key !== expectedHmac || eventId !== expectedHmac) {
            console.error(`HMAC validation failed for event ${eventId}. Replay attack or payload tampering detected.`);
            await snap.ref.delete(); // Immutable reject
            throw new Error(`Invalid HMAC sequence.`);
        }

        const db = admin.firestore();
        const walletId = data.wallet_id;

        // 2. Deterministic Ordering: Assign server sequence_number
        await db.runTransaction(async (transaction) => {
            const walletStateRef = db.collection("wallet_states").doc(walletId);
            const walletStateDoc = await transaction.get(walletStateRef);
            
            let nextSequenceNumber = 1;
            let currentBalance = 0;

            if (walletStateDoc.exists) {
                nextSequenceNumber = (walletStateDoc.data()?.sequence_number || 0) + 1;
                currentBalance = walletStateDoc.data()?.current_balance || 0;
            }

            // Assign sequence number
            transaction.update(snap.ref, { sequence_number: nextSequenceNumber });

            // Derive balances correctly for wallet streams
            let delta = 0;
            switch(data.event_type) {
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
                default:
                    delta = 0; // Unknown events do not mutate
            }

            // Hard boundary overspend check via Cloud Function for Hub Factory Wallets
            if (data.wallet_type === "hub" && currentBalance + delta < 0) {
                throw new Error("OVERDRAFT_BLOCKED: Hub wallets cannot fall below zero.");
            }

            transaction.set(walletStateRef, {
                wallet_id: walletId,
                sequence_number: nextSequenceNumber,
                current_balance: currentBalance + delta,
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
    });
