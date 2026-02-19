/**
 * Shark Operational Intelligence - Centralized Thresholds & Configuration
 */

module.exports = {
    // LARGE_CASH_MOVEMENT
    LARGE_CASH_THRESHOLD: 500_000_000, // 500M IDR

    // YIELD_ANOMALY
    // Yield = (Output Qty / Input Qty)
    YIELD_CONFIG: {
        "RAW_FISH_TO_DRY": {
            expected: 0.35, // 35% yield expected
            threshold: 0.05 // ±5% tolerance
        },
        "DEFAULT": {
            expected: 1.0,
            threshold: 0.1
        }
    },

    // MARGIN_ANOMALY
    MIN_GROSS_MARGIN: 0.15, // 15% minimum margin

    // REPEATED_CASH_PATTERN
    CASH_LIMIT_PER_HOUR: 5, // Max 5 cash transactions per hour

    // Risk Weights
    WEIGHTS: {
        HIGH: 10,
        MEDIUM: 5,
        LOW: 2
    }
};
