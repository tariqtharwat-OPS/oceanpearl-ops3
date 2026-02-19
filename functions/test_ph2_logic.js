/**
 * Phase 2 - Sharded Balance Logic Test
 */

const SHARD_COUNT = 20;

function getShardId(transactionId) {
    let hash = 0;
    for (let i = 0; i < transactionId.length; i++) {
        hash = (hash << 5) - hash + transactionId.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % SHARD_COUNT;
}

// Simulated Shard Accumulator
const shards = {}; // key: account__loc__unit__shardId

function updateSim(entries, transactionId) {
    const shardId = getShardId(transactionId);
    entries.forEach(e => {
        const key = `${e.accountId}__${e.locationId}__${e.unitId}__${shardId}`;
        if (!shards[key]) shards[key] = { balance: 0 };
        const amt = Number(e.baseAmountIDR);
        shards[key].balance += (e.direction === "debit" ? amt : -amt);
    });
}

console.log("--- Phase 2 Logic Test ---");

const entries1 = [
    { accountId: "CASH", locationId: "L1", unitId: "U1", baseAmountIDR: 1000, direction: "debit" },
    { accountId: "REVENUE", locationId: "L1", unitId: "U1", baseAmountIDR: 1000, direction: "credit" }
];
updateSim(entries1, "tx_aaa");

const entries2 = [
    { accountId: "CASH", locationId: "L1", unitId: "U1", baseAmountIDR: 500, direction: "debit" },
    { accountId: "REVENUE", locationId: "L1", unitId: "U1", baseAmountIDR: 500, direction: "credit" }
];
updateSim(entries2, "tx_bbb");

// Summing shards
function getBalance(accountId, loc, unit) {
    let total = 0;
    for (let i = 0; i < SHARD_COUNT; i++) {
        const key = `${accountId}__${loc}__${unit}__${i}`;
        total += (shards[key] ? shards[key].balance : 0);
    }
    return total;
}

console.log(`CASH Balance (Expected 1500): ${getBalance("CASH", "L1", "U1")}`);
console.log(`REVENUE Balance (Expected -1500): ${getBalance("REVENUE", "L1", "U1")}`);

const pass = getBalance("CASH", "L1", "U1") === 1500 && getBalance("REVENUE", "L1", "U1") === -1500;
console.log(`\nOVERALL RESULT: ${pass ? "PASS" : "FAIL"}`);
