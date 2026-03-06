/**
 * OPS V3 - Scheduled Integrity Monitors (Phase 5)
 */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const logger = require("./logger");

/**
 * nightlyBalanceIntegrityMonitor
 * Scans for drift between shards and ledger (sampled).
 */
exports.nightlyBalanceIntegrityMonitor = onSchedule("0 1 * * *", async (event) => {
    logger.info("Starting Nightly Balance Integrity Check", { module: "MONITOR", action: "BALANCE_CHECK" });

    // Sample: Get 5 accounts
    const shards = await db.collection("wallet_events").limit(5).get();

    for (const shardDoc of shards.docs) {
        const d = shardDoc.data();
        const { accountId, locationId, unitId } = d;

        // Sum shards for this specific account scope
        const allShards = await db.collection("wallet_events")
            .where("accountId", "==", accountId)
            .where("locationId", "==", locationId)
            .where("unitId", "==", unitId)
            .get();

        let shardSum = 0;
        allShards.forEach(s => shardSum += Number(s.data().balance || 0));

        // Aggregate ledger (Note: this is a scan, but bounded by monitor frequency and sampling)
        const ledgerSnap = await db.collection("wallet_events")
            .where("accountId", "==", accountId)
            .where("locationId", "==", locationId)
            .where("unitId", "==", unitId)
            .get();

        let ledgerSum = 0;
        ledgerSnap.forEach(l => {
            const le = l.data();
            const amt = Number(le.baseAmountIDR);
            if (le.direction === "debit") ledgerSum += amt;
            else ledgerSum -= amt;
        });

        if (shardSum !== ledgerSum) {
            const incidentId = `DRIFT_${accountId}_${Date.now()}`;
            await db.collection("audit_logs").doc(incidentId).set({
                incidentId,
                type: "BALANCE_DRIFT",
                severity: "HIGH",
                status: "OPEN",
                detectedAt: FieldValue.serverTimestamp(),
                detectedBy: "CRON",
                details: { accountId, locationId, unitId, shardSum, ledgerSum, diff: shardSum - ledgerSum }
            });
            logger.error("Balance drift detected in nightly monitor", {
                module: "MONITOR",
                action: "INCIDENT_REPORT",
                metadata: { accountId, diff: shardSum - ledgerSum }
            });
        }
    }
});

/**
 * nightlyLedgerChainMonitor
 * Verifies hash integrity for recent entries.
 */
exports.nightlyLedgerChainMonitor = onSchedule("0 2 * * *", async (event) => {
    logger.info("Starting Nightly Ledger Chain Integrity Check", { module: "MONITOR", action: "HASH_VERIFY" });

    // Sample 3 accounts that have recent activity
    const recentEntries = await db.collection("wallet_events")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

    const accounts = new Set();
    recentEntries.forEach(doc => accounts.add(doc.data().accountId));

    const crypto = require("crypto");
    const accountSample = Array.from(accounts).slice(0, 3);

    for (const aid of accountSample) {
        // We reuse the verify logic here internally
        let q = db.collection("wallet_events")
            .where("accountId", "==", aid)
            .orderBy("createdAt", "asc")
            .limit(100); // Check last 100 in chain

        const snap = await q.get();
        let lastHash = snap.size > 0 ? snap.docs[0].data().previousHash : "0000000000000000000000000000000000000000000000000000000000000000";

        for (const doc of snap.docs) {
            const e = doc.data();
            const hashPayload = [
                e.transactionId, e.accountId, e.direction, e.baseAmountIDR,
                e.locationId || "null", e.unitId || "null",
                e.createdAt.toDate().toISOString(), e.previousHash
            ].join("|");

            const reHash = crypto.createHash("sha256").update(hashPayload).digest("hex");

            if (e.entryHash !== reHash || e.previousHash !== lastHash) {
                const incidentId = `TAMPER_${aid}_${Date.now()}`;
                await db.collection("audit_logs").doc(incidentId).set({
                    incidentId,
                    type: "LEDGER_TAMPER",
                    severity: "CRITICAL",
                    status: "OPEN",
                    detectedAt: FieldValue.serverTimestamp(),
                    detectedBy: "CRON",
                    details: { docId: doc.id, accountId: aid }
                });
                break;
            }
            lastHash = e.entryHash;
        }
    }
});

/**
 * weeklyCostMonitor
 * Summarizes operational volumes for budget tracking.
 */
exports.weeklyCostMonitor = onSchedule("0 3 * * 0", async (event) => {
    const counts = {};
    const cols = ["wallet_events", "audit_logs", "v3_ops_dedup", "audit_logs"];

    for (const col of cols) {
        const snap = await db.collection(col).count().get();
        counts[col] = snap.data().count;
    }

    const weekKey = `${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7)}`;
    await db.collection("v3_ops_metrics").doc(weekKey).set({
        weekKey,
        counts,
        capturedAt: FieldValue.serverTimestamp()
    });
});
