/**
 * Phase 2 - Full Sharded Balance Audit & Backfill Verification
 */
const admin = require("firebase-admin");
// No service account needed in emulator, but let's assume real if needed
// admin.initializeApp(); 

// Mock data for verification
const ledgerEntries = [
    { accountId: "CASH", locationId: "LOC_A", unitId: "U1", baseAmountIDR: 1000, direction: "debit", transactionId: "tx1", accountCategory: "CASH" },
    { accountId: "REVENUE", locationId: "LOC_A", unitId: "U1", baseAmountIDR: 1000, direction: "credit", transactionId: "tx1", accountCategory: "REVENUE" },
    { accountId: "CASH", locationId: "LOC_A", unitId: "U1", baseAmountIDR: 500, direction: "debit", transactionId: "tx2", accountCategory: "CASH" },
    { accountId: "REVENUE", locationId: "LOC_A", unitId: "U1", baseAmountIDR: 500, direction: "credit", transactionId: "tx2", accountCategory: "REVENUE" }
];

const SHARD_COUNT = 20;

function getShardId(transactionId) {
    let hash = 0;
    for (let i = 0; i < transactionId.length; i++) {
        hash = (hash << 5) - hash + transactionId.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % SHARD_COUNT;
}

// SIMULATION
const shards = {}; // key: account__loc__unit__shardId

function backfill() {
    ledgerEntries.forEach(e => {
        const sid = getShardId(e.transactionId);
        const key = `${e.accountId}__${e.locationId}__${e.unitId}__${sid}`;
        if (!shards[key]) shards[key] = { balance: 0, debit: 0, credit: 0 };
        const amt = e.baseAmountIDR;
        if (e.direction === "debit") {
            shards[key].debit += amt;
            shards[key].balance += amt;
        } else {
            shards[key].credit += amt;
            shards[key].balance -= amt;
        }
    });
}

function reconcile() {
    const accountTotals = {};
    ledgerEntries.forEach(e => {
        if (!accountTotals[e.accountId]) accountTotals[e.accountId] = 0;
        accountTotals[e.accountId] += (e.direction === "debit" ? e.baseAmountIDR : -e.baseAmountIDR);
    });

    const shardTotals = {};
    Object.keys(shards).forEach(k => {
        const aid = k.split("__")[0];
        if (!shardTotals[aid]) shardTotals[aid] = 0;
        shardTotals[aid] += shards[k].balance;
    });

    console.log("--- RECONCILIATION RESULT ---");
    Object.keys(accountTotals).forEach(aid => {
        const l = accountTotals[aid];
        const s = shardTotals[aid] || 0;
        console.log(`Account: ${aid} | Shard Sum: ${s} | Ledger Sum: ${l} | Diff: ${s - l}`);
    });
}

console.log("1. Running simulated backfill...");
backfill();
console.log("2. Running reconciliation audit...");
reconcile();
console.log("\n3. Verifying deterministic keys for scope integrity...");
const s1 = getShardId("tx_sale_1");
const s2 = getShardId("tx_sale_1");
console.log(`Shard Selection Deterministic: ${s1 === s2 ? "YES" : "NO"}`);
