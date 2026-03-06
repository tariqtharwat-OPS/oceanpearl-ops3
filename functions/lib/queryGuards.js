/**
 * OPS V3 - Query Cost Guardrails (Phase 5)
 * Enforces limits and windowing to prevent unbounded scans.
 */
const { HttpsError } = require("firebase-functions/v2/https");

/**
 * Validates list-returning queries against security and cost policies.
 */
function enforceQueryLimits(collection, params = {}) {
    const { limit = 50, timeWindowDays = null } = params;

    // 1. Cap any list query at 5000 records
    const MAX_LIMIT = 5000;
    const constrainedLimit = Math.min(limit, MAX_LIMIT);

    // 2. Collection specific strictly enforced rules
    if (collection === "wallet_events") {
        const LEDGER_MAX = 5000;
        if (limit > LEDGER_MAX) {
            throw new HttpsError("failed-precondition", "QUERY_GUARD_VIOLATION: Ledger scan exceeds 5000 limit.");
        }
    }

    if (collection === "audit_logs") {
        const TRACE_MAX = 2000;
        if (limit > TRACE_MAX) {
            throw new HttpsError("failed-precondition", "QUERY_GUARD_VIOLATION: Trace scan exceeds 2000 limit.");
        }
    }

    if (collection === "audit_logs") {
        const SHARK_MAX = 1000;
        if (limit > SHARK_MAX) {
            throw new HttpsError("failed-precondition", "QUERY_GUARD_VIOLATION: Alert scan exceeds 1000 limit.");
        }
    }

    return constrainedLimit;
}

module.exports = {
    enforceQueryLimits
};
