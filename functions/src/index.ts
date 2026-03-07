import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { validateWalletEvent } from "./validateWalletEvent";
import { validateTransferEvent } from "./validateTransferEvent";
import { validateDocumentRequest } from "./validateDocumentRequest";

admin.initializeApp();

// Export the core idempotent validation triggers
export { validateWalletEvent, validateTransferEvent, validateDocumentRequest };

// TASK 6 — OFFLINE QUEUE MONITOR
export const debugOfflineQueue = functions.https.onRequest(async (req, res) => {
    // This is a dummy response representing what a debug view would show.
    // In production, the "queue" is client-side, but if we stored sync 
    // metadata or failed events server-side, it would be queried here.

    const db = admin.firestore();
    const resolutionQueue = await db.collection("error_resolution_queue").limit(50).get();

    const results = resolutionQueue.docs.map(doc => {
        const data = doc.data();
        return {
            device_id: data.device_id,
            pending_events: data.pending_events_count || 1,
            retry_attempts: data.retry_attempts || 0,
            rejection_errors: data.error_message || "UNKNOWN"
        };
    });

    res.json({
        status: "success",
        message: "Developer debug monitor online",
        offline_queue: results
    });
});

// TASK 8 — EVENT SEQUENCE DEBUG TOOL 
export const debugWalletSequence = functions.https.onRequest(async (req, res) => {
    const walletId = req.query.wallet_id;
    if (!walletId || typeof walletId !== "string") {
        res.status(400).send("Missing ?wallet_id parameter");
        return;
    }

    const db = admin.firestore();
    const sequenceQuery = await db.collection("wallet_events")
        .where("wallet_id", "==", walletId)
        .orderBy("sequence_number", "asc")
        .limit(100)
        .get();

    const stream = sequenceQuery.docs.map(doc => {
        const d = doc.data();
        return {
            event_id: doc.id,
            sequence_number: d.sequence_number,
            amount: d.amount,
            event_type: d.event_type,
            recorded_at: d.recorded_at,
            server_time: d.server_timestamp
        };
    });

    res.json({
        wallet_id: walletId,
        ordered_stream: stream
    });
});
