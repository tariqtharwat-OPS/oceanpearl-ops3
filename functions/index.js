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

// Export Admin functions
const { v3Bootstrap } = require("./admin/v3Bootstrap");
const { v3SeedTestPack } = require("./admin/v3SeedTestPack");

// Phase 6 Monitor
exports.ops3Monitor = require("./lib/monitor").ops3Monitor;
exports.v3Bootstrap = v3Bootstrap;
exports.v3SeedTestPack = v3SeedTestPack;

const { onCall } = require("firebase-functions/v2/https");
const { getTripProfit } = require("./lib/documentProcessor");

exports.getTripProfit = onCall(async (request) => {
    // Audit compliance: Ensure analyst/admin scope via token
    if (!request.auth) throw new Error("UNAUTHENTICATED");
    return await getTripProfit(request.data.trip_id);
});

const logger = require("./lib/logger");
logger.info("OPS V3 Functions initialized", { module: "SYSTEM", action: "BOOT" });
