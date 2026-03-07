import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

export const validateDocumentRequest = functions.firestore
    .document("document_requests/{requestId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const requestId = context.params.requestId;

        if (!data) return;

        const HMAC_SECRET = process.env.HMAC_SECRET || "OPS3_PHASE0_DEV_SECRET";

        // 1. Validate payload integrity
        const { idempotency_key, nonce, lines, ...payloadData } = data;

        // Reconstruct the exact stringified object hash
        // We know we sent the whole payload, so:
        const payloadString = JSON.stringify({ ...payloadData, lines });
        const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

        const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET)
            .update(payloadHash + (nonce || ""))
            .digest('hex');

        if (idempotency_key !== expectedHmac) {
            console.error(`HMAC validation failed on document_request. Replay attack or payload tampering detected.`);
            await snap.ref.delete();
            throw new Error(`Invalid HMAC sequence.`);
        }

        const db = admin.firestore();
        const lockRef = db.collection("idempotency_locks").doc(expectedHmac);

        // 2. Idempotency Lock
        await db.runTransaction(async (lockTx) => {
            const lockDoc = await lockTx.get(lockRef);
            if (lockDoc.exists) {
                const lockData = lockDoc.data()!;
                if (lockData.status === "COMPLETED") {
                    throw new Error("IDEMPOTENCY_REJECT: Document already processed.");
                }
                if (lockData.status === "RUNNING") {
                    const elapsed = Date.now() - lockData.timestamp;
                    if (elapsed < 60000) {
                        throw new Error("IDEMPOTENCY_REJECT: Document currently running.");
                    }
                }
            }
            lockTx.set(lockRef, { status: "RUNNING", timestamp: Date.now() });
        });

        try {
            await db.runTransaction(async (transaction) => {
                // 3a. Pre-fetch all referenced wallets to avoid read-after-write errors
                const walletIds = [...new Set(lines ? lines.map((l: any) => l.wallet_id).filter(Boolean) : [])] as string[];
                const walletStateDocs = new Map<string, admin.firestore.DocumentSnapshot>();

                for (const wid of walletIds) {
                    const walletStateRef = db.collection("wallet_states").doc(wid);
                    const doc = await transaction.get(walletStateRef);
                    if (doc.exists) {
                        walletStateDocs.set(wid, doc);
                    }
                }

                // 3b. Keep mutable state in memory
                const activeWallets = new Map<string, { currentBalance: number, sequenceNumber: number }>();
                for (const wid of walletIds) {
                    const doc = walletStateDocs.get(wid);
                    if (doc) {
                        activeWallets.set(wid, {
                            currentBalance: doc.data()?.current_balance || 0,
                            sequenceNumber: doc.data()?.sequence_number || 0
                        });
                    } else {
                        activeWallets.set(wid, {
                            currentBalance: 0,
                            sequenceNumber: 0
                        });
                    }
                }

                // 3c. Document Creation (Immutable)
                const docRef = db.collection("documents").doc(expectedHmac);
                transaction.set(docRef, {
                    ...payloadData,
                    lines: lines || [],
                    idempotency_key,
                    nonce,
                    status: "posted",
                    server_timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

                // 4. Generate Wallet Events
                if (lines && Array.isArray(lines)) {
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.wallet_id && line.amount && line.event_type) {

                            const walletState = activeWallets.get(line.wallet_id)!;
                            walletState.sequenceNumber += 1;

                            let delta = 0;
                            switch (line.event_type) {
                                case "deposit":
                                case "transfer_received":
                                case "deposit_cash_handover":
                                case "revenue_cash":
                                    delta = line.amount;
                                    break;
                                case "expense":
                                case "expense_advance":
                                case "expense_trip":
                                case "expense_purchase":
                                case "transfer_initiated":
                                    delta = -line.amount;
                                    break;
                                default:
                                    delta = 0;
                            }

                            if (line.wallet_type === "hub" && walletState.currentBalance + delta < 0) {
                                throw new Error("OVERDRAFT_BLOCKED: Hub wallets cannot fall below zero.");
                            }

                            walletState.currentBalance += delta;

                            // Use a unique ID for the synthesized wallet event
                            const synthesizedEventId = `${expectedHmac}_L${i}`;
                            const eventRef = db.collection("wallet_events").doc(synthesizedEventId);

                            transaction.set(eventRef, {
                                ...line,
                                parent_document_id: expectedHmac,
                                sequence_number: walletState.sequenceNumber,
                                server_timestamp: admin.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }
                }

                // 5. Write back all final wallet states
                for (const wid of walletIds) {
                    const walletStateRef = db.collection("wallet_states").doc(wid);
                    const finalState = activeWallets.get(wid)!;
                    transaction.set(walletStateRef, {
                        wallet_id: wid,
                        sequence_number: finalState.sequenceNumber,
                        current_balance: finalState.currentBalance,
                        last_updated: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }

            });

            // 5. Complete lock and remove request
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
