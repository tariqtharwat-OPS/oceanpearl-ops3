/**
 * Ocean Pearl OPS V3 - Cloud Functions
 * 
 * This is the main entry point for all V3 Cloud Functions.
 * All functions are deployed to asia-southeast1 region.
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

// Set global region for all functions
setGlobalOptions({ region: "asia-southeast1" });

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// Export all function modules
exports.ledger = require("./lib/ledger");
exports.inventory = require("./lib/inventory");
exports.workflows = require("./lib/workflows");
exports.shark = require("./lib/shark");
exports.traceability = require("./lib/traceability");
exports.reporting = require("./lib/reporting");
exports.audit = require("./lib/auditExports");
exports.adminBalances = require("./admin/v3AdminBalances");
exports.periods = require("./admin/v3AdminPeriods");
exports.incidents = require("./admin/v3AdminIncidents");
exports.health = require("./lib/health");
exports.monitors = require("./lib/monitors");
exports.enforcement = require("./admin/v3AdminEnforcement");

// Core Idempotent Document Processor
exports.validateDocumentRequest = require("./lib/documentProcessor").validateDocumentRequest;

// Phase 2 Step 2 — Processing Batch Management
const processingBatches = require("./lib/processingBatches");
exports.createProcessingBatch = processingBatches.createProcessingBatch;
exports.updateProcessingBatch = processingBatches.updateProcessingBatch;
exports.getProcessingBatch = processingBatches.getProcessingBatch;

// Export Admin functions
const { v3Bootstrap } = require("./admin/v3Bootstrap");
const { v3SeedTestPack } = require("./admin/v3SeedTestPack");

// Phase 6 Monitor
exports.ops3Monitor = require("./lib/monitor").ops3Monitor;
exports.v3Bootstrap = v3Bootstrap;
exports.v3SeedTestPack = v3SeedTestPack;

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getTripProfit } = require("./lib/documentProcessor");

exports.getTripProfit = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "AUTH_REQUIRED");

    const db = admin.firestore();
    const tripId = request.data.trip_id;
    if (!tripId) throw new HttpsError("invalid-argument", "MISSING_TRIP_ID");

    // 1. Read scope document (use S0 as representative)
    const docSnap = await db.collection("trip_profit_views").doc(`${tripId}__S0`).get();
    if (!docSnap.exists) throw new HttpsError("not-found", "TRIP_NOT_FOUND");

    const doc = docSnap.data();
    const user = request.auth.token;
    const userRole = (user && user.role) ? user.role.toLowerCase() : '';
    const isHQ = ['hq_analyst', 'admin', 'ceo'].includes(userRole);

    // 2. Validate Scope (FIX 1)
    if (isHQ) {
        if (user.company_id !== doc.company_id) {
            throw new HttpsError("permission-denied", "COMPANY_MISMATCH");
        }
    } else {
        if (user.company_id !== doc.company_id || user.unit_id !== doc.unit_id) {
            throw new HttpsError("permission-denied", "UNIT_SCOPE_MISMATCH");
        }
    }

    return await getTripProfit(tripId);
});

const logger = require("./lib/logger");
logger.info("OPS V3 Functions initialized", { module: "SYSTEM", action: "BOOT" });
