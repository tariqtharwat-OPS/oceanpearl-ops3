import * as admin from "firebase-admin";
import * as crypto from "crypto";

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.HMAC_SECRET = 'OPS3_PHASE0_DEV_SECRET';

admin.initializeApp({ projectId: "ops3-production" });
const db = admin.firestore();

const HMAC_SECRET = process.env.HMAC_SECRET;

function generateHmac(payload: any, nonce: string) {
    const payloadStr = JSON.stringify(payload);
    const hash = crypto.createHash('sha256').update(payloadStr).digest('hex');
    return crypto.createHmac('sha256', HMAC_SECRET).update(hash + nonce).digest('hex');
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function runTests() {
    console.log("🔥 Starting OPS3 Chaos Testing Harness...");
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, msg: string) => {
        if (condition) {
            console.log(`[PASS] ${msg}`);
            passed++;
        } else {
            console.error(`[FAIL] ${msg}`);
            failed++;
        }
    };

    try {
        // --- 1. Duplicate Wallet Event ---
        console.log("\n--- TEST: Duplicate Wallet Event ---");
        const dupPayload = {
            wallet_id: "wallet_test_01", amount: 100, currency: "IDR", event_type: "deposit",
            company_id: "co_1", location_id: "loc_1", unit_id: "unit_1"
        };
        const dupNonce = "dup_nonce_" + Date.now();
        const dupHmac = generateHmac(dupPayload, dupNonce);

        await db.collection("wallet_event_requests").add({ ...dupPayload, idempotency_key: dupHmac, nonce: dupNonce });
        await db.collection("wallet_event_requests").add({ ...dupPayload, idempotency_key: dupHmac, nonce: dupNonce });

        await sleep(2000); // wait for CF to process

        const dupLock = await db.collection("idempotency_locks").doc(dupHmac).get();
        assert(dupLock.exists && dupLock.data()?.status === "COMPLETED", "Duplicate submission mitigated by idempotency lock");

        // --- 2. Replay Attack ---
        console.log("\n--- TEST: Replay Attack ---");
        const repPayload = { wallet_id: "wallet_test_01", amount: 100, currency: "IDR", event_type: "deposit" };
        const repNonce = "rep_nonce_" + Date.now();
        const repHmac = generateHmac(repPayload, repNonce);
        // Alter payload amount to 9999 but keep original HMAC
        const maliciousPayload = { ...repPayload, amount: 9999 };

        await db.collection("wallet_event_requests").add({ ...maliciousPayload, idempotency_key: repHmac, nonce: repNonce });
        await sleep(1000);

        const repLock = await db.collection("idempotency_locks").doc(repHmac).get();
        assert(!repLock.exists, "Replay attack rejected due to HMAC mismatch (lock never generated)");

        // --- 3. Two-Device Wallet Overspend ---
        console.log("\n--- TEST: Two-Device Wallet Overspend ---");
        // Ensure wallet has explicitly 100 limit, wait for deposit
        const overspendWalletId = "wallet_test_overspend_" + Date.now();
        const fundingPayload = { wallet_id: overspendWalletId, amount: 100, event_type: "deposit", wallet_type: "hub" };
        const fNonce = "f_nonce";
        await db.collection("wallet_event_requests").add({ ...fundingPayload, idempotency_key: generateHmac(fundingPayload, fNonce), nonce: fNonce });
        await sleep(1500);

        const spendPayload1 = { wallet_id: overspendWalletId, amount: 80, event_type: "expense", wallet_type: "hub" };
        const send1 = generateHmac(spendPayload1, "nonce_s1");
        const spendPayload2 = { wallet_id: overspendWalletId, amount: 80, event_type: "expense", wallet_type: "hub" };
        const send2 = generateHmac(spendPayload2, "nonce_s2");

        await Promise.all([
            db.collection("wallet_event_requests").add({ ...spendPayload1, idempotency_key: send1, nonce: "nonce_s1" }),
            db.collection("wallet_event_requests").add({ ...spendPayload2, idempotency_key: send2, nonce: "nonce_s2" })
        ]);

        await sleep(2000);

        const lock1 = await db.collection("idempotency_locks").doc(send1).get();
        const lock2 = await db.collection("idempotency_locks").doc(send2).get();
        const st1 = lock1.data()?.status;
        const st2 = lock2.data()?.status;

        assert((st1 === "COMPLETED" && st2 === "FAILED") || (st1 === "FAILED" && st2 === "COMPLETED"),
            "Overdraft boundary enforced correctly under concurrent race");

        // --- 4. Inventory Race Conflict ---
        console.log("\n--- TEST: Inventory Race Conflict ---");
        const invUnit = "unit_race_" + Date.now();
        const invPayload = {
            location_id: "loc_race", unit_id: invUnit, sku_id: "sku_1",
            amount: 50, event_type: "receive_own"
        };
        const iNonce = "i_nonce";
        await db.collection("inventory_event_requests").add({ ...invPayload, idempotency_key: generateHmac(invPayload, iNonce), nonce: iNonce });
        await sleep(1500);

        const spendInv1 = { ...invPayload, amount: 40, event_type: "sale_out" };
        const invHmac1 = generateHmac(spendInv1, "inv_s1");
        const spendInv2 = { ...invPayload, amount: 40, event_type: "sale_out" };
        const invHmac2 = generateHmac(spendInv2, "inv_s2");

        await Promise.all([
            db.collection("inventory_event_requests").add({ ...spendInv1, idempotency_key: invHmac1, nonce: "inv_s1" }),
            db.collection("inventory_event_requests").add({ ...spendInv2, idempotency_key: invHmac2, nonce: "inv_s2" })
        ]);
        await sleep(2000);

        const invL1 = await db.collection("idempotency_locks").doc(invHmac1).get();
        const invL2 = await db.collection("idempotency_locks").doc(invHmac2).get();
        assert((invL1.data()?.status === "COMPLETED" && invL2.data()?.status === "FAILED") ||
            (invL1.data()?.status === "FAILED" && invL2.data()?.status === "COMPLETED"),
            "Inventory stock deficit boundaries enforced under concurrent race");

        // --- 5. Clock Skew Attack ---
        console.log("\n--- TEST: Clock Skew Attack ---");
        const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
        const skewPayload = {
            wallet_id: "wallet_skew", amount: 10, currency: "IDR", event_type: "deposit", recorded_at: futureDate
        };
        const sNonce = "skew_nonce";
        const sHmac = generateHmac(skewPayload, sNonce);

        await db.collection("wallet_event_requests").add({ ...skewPayload, idempotency_key: sHmac, nonce: sNonce });
        await sleep(1500);

        const ev = await db.collection("wallet_events").doc(sHmac).get();
        const serverTime = ev.data()?.server_timestamp;
        assert(serverTime && serverTime.toDate().getTime() < Date.now() + 10000, "Device clock ignored. Server monotonic timestamp strictly enforced in ledger.");

    } catch (e: any) {
        console.error("Test Harness Error:", e.message);
    } finally {
        console.log(`\n✅ Chaos Run Completed: ${passed} Passed, ${failed} Failed.`);
        process.exit(failed > 0 ? 1 : 0);
    }
}

runTests();
