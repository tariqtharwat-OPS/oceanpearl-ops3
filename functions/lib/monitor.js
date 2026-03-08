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

    // 1. Fetch Necessary Configs for Resolution
    const allConfigs = new Map();
    const defaultConfig = await db.collection("control_config").doc("default").get();
    allConfigs.set("default", defaultConfig.exists ? defaultConfig.data() : { yield_variance_threshold: 0.1, transfer_delay_hours: 24, max_cost_basis: 1000000 });

    const CO = "Ocean-Pearl-SC"; // HQ Scope

    // 2. Monitor Transfer Aging (In-Transit Transfers) — Optimized batching
    const inTransit = await db.collection("transfer_views")
        .where("company_id", "==", CO)
        .where("status", "==", "in_transit")
        .limit(100)
        .get();

    for (const doc of inTransit.docs) {
        const data = doc.data();
        if (!data.initiated_at) continue;

        // Resolve Config for this specific location/unit
        const locConfig = data.location_id ? (await db.collection("control_config").doc(`loc__${data.location_id}`).get()) : null;
        const unitConfig = data.unit_id ? (await db.collection("control_config").doc(`unit__${data.unit_id}`).get()) : null;

        const finalDelay = unitConfig?.exists && unitConfig.data().transfer_delay_hours !== undefined ? unitConfig.data().transfer_delay_hours :
            (locConfig?.exists && locConfig.data().transfer_delay_hours !== undefined ? locConfig.data().transfer_delay_hours :
                allConfigs.get("default").transfer_delay_hours);

        const ageHours = (now - data.initiated_at.toDate().getTime()) / (1000 * 60 * 60);
        if (ageHours > finalDelay) {
            await db.collection("transfer_alerts").doc(`MONITOR_${doc.id}`).set({
                company_id: data.company_id, location_id: data.location_id, unit_id: data.unit_id,
                document_id: doc.id, age_hours: Math.round(ageHours),
                type: "TRANSFER_STUCK_IN_TRANSIT",
                timestamp: FieldValue.serverTimestamp()
            });
        }
    }

    // 3. Monitor Overdue Payables — Optimized batching
    const pendingPayables = await db.collection("payable_views")
        .where("company_id", "==", CO)
        .where("status", "==", "pending")
        .limit(100)
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

    // 4. Monitor Overdue Receivables — Optimized batching
    const pendingReceivables = await db.collection("receivable_views")
        .where("company_id", "==", CO)
        .where("status", "==", "pending")
        .limit(100)
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
