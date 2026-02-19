/**
 * Shark Detectors - Pure functions for operational intelligence.
 * No Firestore writes. No side effects.
 */
const config = require("./sharkConfig");

/**
 * LARGE_CASH_MOVEMENT
 */
function detectLargeCashMovement(entry) {
    const amt = Number(entry.baseAmountIDR || 0);
    const category = String(entry.accountCategory || "");

    if (category === "CASH" && amt > config.LARGE_CASH_THRESHOLD) {
        return {
            code: "LARGE_CASH_MOVEMENT",
            severity: "HIGH",
            scoreImpact: config.WEIGHTS.HIGH,
            context: { amt, threshold: config.LARGE_CASH_THRESHOLD }
        };
    }
    return null;
}

/**
 * MARGIN_ANOMALY
 * Triggered on SALE workflows.
 * Best computed when both Sale revenue and COGS are present in the same txn.
 */
function detectMarginAnomaly(entries) {
    let revenue = 0;
    let cogs = 0;

    entries.forEach(e => {
        const amt = Number(e.baseAmountIDR || 0);
        if (e.accountCategory === "REVENUE") {
            revenue += amt;
        } else if (e.accountCategory === "COGS") {
            cogs += amt;
        }
    });

    if (revenue > 0) {
        const margin = (revenue - cogs) / revenue;
        if (margin < config.MIN_GROSS_MARGIN) {
            return {
                code: "MARGIN_ANOMALY",
                severity: "MEDIUM",
                scoreImpact: config.WEIGHTS.MEDIUM,
                context: { margin, minThreshold: config.MIN_GROSS_MARGIN, revenue, cogs }
            };
        }
    }
    return null;
}

/**
 * YIELD_ANOMALY
 * Triggered on PRODUCTION trace events.
 */
function detectYieldAnomaly(traceEvent) {
    if (traceEvent.type !== "PRODUCTION") return null;

    const inQty = Number(traceEvent.inputQtyKg || 0); // Assuming trace event has these
    const outQty = Number(traceEvent.outputQtyKg || 0);

    if (inQty > 0) {
        const yieldActual = outQty / inQty;
        const skuKey = "RAW_FISH_TO_DRY"; // Simplified for Phase 3
        const rule = config.YIELD_CONFIG[skuKey] || config.YIELD_CONFIG.DEFAULT;

        const diff = Math.abs(yieldActual - rule.expected);
        if (diff > rule.threshold) {
            return {
                code: "YIELD_ANOMALY",
                severity: "HIGH",
                scoreImpact: config.WEIGHTS.HIGH,
                context: { yieldActual, expected: rule.expected, threshold: rule.threshold }
            };
        }
    }
    return null;
}

/**
 * REPEATED_CASH_PATTERN
 * Requires contextual count from Firestore (provided by caller).
 */
function detectRepeatedCashPattern(cashTxCountLastHour) {
    if (cashTxCountLastHour > config.CASH_LIMIT_PER_HOUR) {
        return {
            code: "REPEATED_CASH_PATTERN",
            severity: "MEDIUM",
            scoreImpact: config.WEIGHTS.MEDIUM,
            context: { count: cashTxCountLastHour, limit: config.CASH_LIMIT_PER_HOUR }
        };
    }
    return null;
}

module.exports = {
    detectLargeCashMovement,
    detectMarginAnomaly,
    detectYieldAnomaly,
    detectRepeatedCashPattern
};
