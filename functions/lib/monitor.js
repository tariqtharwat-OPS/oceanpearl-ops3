const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

/**
 * OPS3 Background Monitor
 * Scheduled every 30 minutes to detect anomalies that are not captured during document processing.
 */
exports.ops3Monitor = onSchedule({
    schedule: "every 30 mins",
    region: "asia-southeast1",
    memory: "512MiB"
}, async (event) => {
    const db = admin.firestore();
    const now = Date.now();

    // 1. Fetch System Config
    const configSnap = await db.collection("control_config").doc("default").get();
    const config = configSnap.exists ? configSnap.data() : {
        yield_variance_threshold: 0.1,
        transfer_delay_hours: 24,
        overdue_days: 0
    };

    // 2. Monitor Transfer Aging (In-Transit Transfers)
    const inTransit = await db.collection("transfer_views")
        .where("status", "==", "in_transit")
        .get();

    for (const doc of inTransit.docs) {
        const data = doc.data();
        if (!data.initiated_at) continue;

        const ageHours = (now - data.initiated_at.toDate().getTime()) / (1000 * 60 * 60);
        if (ageHours > config.transfer_delay_hours) {
            await db.collection("transfer_alerts").doc(`MONITOR_${doc.id}`).set({
                company_id: data.company_id, location_id: data.location_id, unit_id: data.unit_id,
                document_id: doc.id, age_hours: Math.round(ageHours),
                type: "TRANSFER_STUCK_IN_TRANSIT",
                timestamp: FieldValue.serverTimestamp()
            });
        }
    }

    // 3. Monitor Overdue Payables
    const pendingPayables = await db.collection("payable_views")
        .where("status", "==", "pending")
        .get();

    for (const doc of pendingPayables.docs) {
        const data = doc.data();
        if (!data.due_date) continue;

        if (new Date(data.due_date) < new Date()) {
            await db.collection("payable_alerts").doc(`MONITOR_${doc.id}`).set({
                company_id: data.company_id, location_id: data.location_id, unit_id: data.unit_id,
                document_id: doc.id, type: "OVERDUE_PAYMENT_DETECTED",
                timestamp: FieldValue.serverTimestamp()
            });
        }
    }

    // 4. Monitor Overdue Receivables
    const pendingReceivables = await db.collection("receivable_views")
        .where("status", "==", "pending")
        .get();

    for (const doc of pendingReceivables.docs) {
        const data = doc.data();
        if (!data.due_date) continue;

        if (new Date(data.due_date) < new Date()) {
            await db.collection("receivable_alerts").doc(`MONITOR_${doc.id}`).set({
                company_id: data.company_id, location_id: data.location_id, unit_id: data.unit_id,
                document_id: doc.id, type: "OVERDUE_COLLECTION_DETECTED",
                timestamp: FieldValue.serverTimestamp()
            });
        }
    }

    logger.info("OPS3 Monitor completed cycle.");
});
