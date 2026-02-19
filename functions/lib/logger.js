/**
 * OPS V3 - Standardized Structured Logger (Phase 5)
 * Enforces JSON output for observability.
 */
const { logger } = require("firebase-functions");

/**
 * Core log emitter
 */
function emit(severity, msg, context = {}) {
    const logEntry = {
        severity,
        module: context.module || "UNKNOWN",
        action: context.action || "UNKNOWN",
        correlationId: context.correlationId || context.transactionId || context.idempotencyKey || null,
        uid: context.uid || "SYSTEM",
        locationId: context.locationId || null,
        unitId: context.unitId || null,
        message: msg,
        metadata: context.metadata || {},
        ts: new Date().toISOString(),
        version: 5 // Logic Version for Phase 5
    };

    if (severity === "ERROR") {
        logger.error(msg, logEntry);
    } else if (severity === "WARN") {
        logger.warn(msg, logEntry);
    } else if (severity === "DEBUG") {
        logger.debug(msg, logEntry);
    } else {
        logger.info(msg, logEntry);
    }
}

const debug = (msg, ctx) => emit("DEBUG", msg, ctx);
const info = (msg, ctx) => emit("INFO", msg, ctx);
const warn = (msg, ctx) => emit("WARN", msg, ctx);
const error = (msg, ctx) => emit("ERROR", msg, ctx);

module.exports = {
    debug,
    info,
    warn,
    error
};
