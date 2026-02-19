const https = require('https');
// We are in local dev, we don't have service-account.json easily unless we download it.
// Actually, let's use the existing test pattern: HTTPS for writes/chat, and maybe we can't read Firestore directly easily without Admin SDK setup.
// But we have `test_shark_chat_prod.js` which uses HTTPS.
// We can use `test_shark_atomic.js` pattern (local script using Admin SDK with key?)
// Or just rely on `sharkChat` to tell us the values!

// Let's rely on Shark Chat to verify the views.
// 1. Write Data (via HTTP call to `receiveLot` or `recordPayment`?)
// We have `receiveLot` and `recordPayment` callable functions.
// We can use them to trigger the events.

const FUNCTIONS_HOST = 'asia-southeast1-oceanpearl-ops.cloudfunctions.net';
const AUTH_HOST = 'identitytoolkit.googleapis.com';
const API_KEY = 'AIzaSyBmHSr7huWpMZa9RnKNBgV6fnXltmvsxcc'; // From .env

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

function json(res) {
    try { return JSON.parse(res.body); } catch { return { raw: res.body }; }
}

async function getIdToken(email, password) {
    const d = JSON.stringify({ email, password, returnSecureToken: true });
    let res = await request({
        hostname: AUTH_HOST,
        path: `/v1/accounts:signInWithPassword?key=${API_KEY}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) }
    }, d);
    let j = json(res);
    if (j.idToken) return { token: j.idToken, uid: j.localId };
    throw new Error("Auth failed: " + JSON.stringify(j));
}

async function callFunction(name, token, payload) {
    const data = JSON.stringify({ data: payload });
    const res = await request({
        hostname: FUNCTIONS_HOST,
        path: `/${name}`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    }, data);
    return { status: res.status, ...json(res) };
}

async function run() {
    console.log("🦈 SHARK AI MATERIALIZED VIEW VERIFICATION");
    console.log("========================================");

    // 1. Auth
    const { token } = await getIdToken("ceo@oceanpearlseafood.com", "OceanPearl2026!");
    console.log("Authenticated as CEO");

    // 2. Trigger Inventory Write (Receive Lot)
    console.log("\n1. Writing Inventory (Receive Lot)...");
    const lotRes = await callFunction("receiveLot", token, {
        operationId: `verif_op_${Date.now()}`,
        unitId: 'unit_1',
        productSpecId: 'TEST_SPEC',
        quantityKg: 500,
        pricePerKg: 10,
        currency: 'USD', // This triggers wallet update too (Ledger)
        supplierId: 'verified_supplier'
    });
    console.log("Write Result:", lotRes);

    console.log("Waiting 5s for Event Triggers...");
    await new Promise(r => setTimeout(r, 5000));

    // 3. Ask Shark about Stock
    console.log("\n2. Q: Stock?");
    const chat1 = await callFunction("sharkChat", token, { message: "What is the total stock of TEST_SPEC?" });
    console.log("A:", chat1.result?.response || chat1);

    // 4. Ask Shark about Wallet
    console.log("\n3. Q: Wallet Balance?");
    const chat2 = await callFunction("sharkChat", token, { message: "What is the balance of unit_1_cash?" });
    console.log("A:", chat2.result?.response || chat2);

    // 5. Ask Shark about Global Stock
    console.log("\n4. Q: Global Stock?");
    const chat3 = await callFunction("sharkChat", token, { message: "What is my global stock position for TEST_SPEC?" });
    console.log("A:", chat3.result?.response || chat3);
}

run().catch(console.error);
