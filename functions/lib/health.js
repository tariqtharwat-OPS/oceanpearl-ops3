/**
 * OPS V3 - Health, Readiness and Integrity Checks (Phase 5)
 */
const { onRequest } = require("firebase-functions/v2/https");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();

const { requireAuth, getUserProfile, requireRole } = require("./auth");
const logger = require("./logger");

const VERSION = "5.0.0";
const COMMIT_HASH = process.env.COMMIT_HASH || "dev-0";

/**
 * /healthz - Liveness check
 */
exports.healthz = onRequest((req, res) => {
    res.status(200).json({
        ok: true,
        version: VERSION,
        commit: COMMIT_HASH,
        region: "asia-southeast1",
        ts: new Date().toISOString()
    });
});

/**
 * /readyz - Readiness check (bounded connectivity tests)
 */
exports.readyz = onRequest(async (req, res) => {
    try {
        const checks = {
            periods: false,
            shards: false,
            users: false
        };

        const [pSnap, sSnap, uSnap] = await Promise.all([
            db.collection("v3_financial_periods").limit(1).get(),
            db.collection("wallet_events").limit(1).get(),
            db.collection("v3_users").limit(1).get()
        ]);

        checks.periods = !pSnap.empty || true; // Empty is ok if initialized
        checks.shards = !sSnap.empty || true;
        checks.users = !uSnap.empty || true;

        res.status(200).json({ ok: true, checks, ts: new Date().toISOString() });
    } catch (err) {
        logger.error("Readyz check failed", { error: err.message });
        res.status(503).json({ ok: false, message: "Service Unavailable" });
    }
});

/**
 * adminRunIntegrityChecks - Deep on-demand verification
 */
exports.adminRunIntegrityChecks = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo"]);

    const results = {
        timestamp: new Date().toISOString(),
        checks: []
    };

    // 1. Period Sanity (No overlaps)
    const openPeriods = await db.collection("v3_financial_periods").where("status", "==", "OPEN").get();
    if (openPeriods.size > 1) {
        results.checks.push({ type: "PERIOD_OVERLAP", status: "FAIL", count: openPeriods.size });
    } else {
        results.checks.push({ type: "PERIOD_OVERLAP", status: "PASS" });
    }

    // 2. Index Presence (Small query test)
    try {
        await db.collection("wallet_events")
            .where("accountId", "==", "CASH")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        results.checks.push({ type: "INDEX_SANITY", status: "PASS" });
    } catch (e) {
        results.checks.push({ type: "INDEX_SANITY", status: "FAIL", error: e.message });
    }

    return results;
});
