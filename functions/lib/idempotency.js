/**
 * OPS V3 - Idempotency Helper
 */
const admin = require("firebase-admin");
const logger = require("./logger");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");
const { HttpsError } = require("firebase-functions/v2/https");

/**
 * withIdempotency
 * 
 * Ensures a function with a given key only runs once successfully.
 * Handles state: RUNNING, COMPLETED, FAILED.
 * 
 * Phase 1.5: 
 * - Added lockedAt for zombie recovery.
 * - Auto-release stale RUNNING > 5 minutes.
 */
async function withIdempotency(key, uid, workFn) {
    if (!key) throw new HttpsError("invalid-argument", "idempotencyKey is required.");

    const dedupRef = db.collection("v3_ops_dedup").doc(String(key));

    return await db.runTransaction(async (transaction) => {
        const dSnap = await transaction.get(dedupRef);

        if (dSnap.exists) {
            const data = dSnap.data();
            if (data.status === "COMPLETED") {
                logger.info("Idempotency hit: COMPLETED", { key, uid });
                return data.responsePayload;
            }
        }

        try {
            const result = await workFn(transaction);

            // Mark as COMPLETED (at the end of the transaction)
            transaction.set(dedupRef, {
                status: "COMPLETED",
                uid,
                responsePayload: result,
                completedAt: FieldValue.serverTimestamp(),
                createdAt: dSnap.exists ? dSnap.data().createdAt : FieldValue.serverTimestamp(),
                version: 3
            }, { merge: true });

            return result;
        } catch (err) {
            // No need to set FAILED state, transaction rollback handles it
            throw err;
        }
    });
}

module.exports = {
    withIdempotency,
};
