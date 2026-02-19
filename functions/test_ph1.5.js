/**
 * Phase 1.5 Verification Script
 */
const { info, error } = require("./lib/logger");

// 1. WAC Logic Verification (Pure Math)
function computeWAC(oldQty, oldAvg, deltaQty, newCost) {
    const newQty = oldQty + deltaQty;
    if (newQty <= 0) return 0;
    if (deltaQty > 0) {
        return Math.round((oldQty * oldAvg + deltaQty * newCost) / newQty);
    }
    return Math.round(oldAvg);
}

console.log("--- WAC MATH TEST ---");
const t1 = computeWAC(10, 1000, 10, 2000); // Expect (10k + 20k)/20 = 1500
console.log(`Test 1 (Receive): ${t1 === 1500 ? "PASS" : "FAIL (" + t1 + ")"}`);

const t2 = computeWAC(20, 1500, -5, 0); // Expect 1500 (Sales don't change avg)
console.log(`Test 2 (Sale): ${t2 === 1500 ? "PASS" : "FAIL (" + t2 + ")"}`);

const t3 = computeWAC(15, 1500, -15, 0); // Expect 0 (Zero base)
console.log(`Test 3 (Clear): ${t3 === 0 ? "PASS" : "FAIL (" + t3 + ")"}`);

// 2. Structured Log Example
console.log("\n--- LOGGER EXAMPLE ---");
info("Test structured log", { testId: "ph1.5-audit", context: "verification" });

console.log("\n--- VERIFICATION COMPLETE ---");
