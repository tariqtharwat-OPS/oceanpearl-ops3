const https = require('https');

const AUTH_HOST = 'identitytoolkit.googleapis.com';
const FIRESTORE_HOST = 'firestore.googleapis.com';
const PROJECT_ID = 'oceanpearl-ops';
const API_KEY = 'AIzaSyBmHSr7huWpMZa9RnKNBgV6fnXltmvsxcc';

// Known user (CEO)
const EMAIL = "ceo@oceanpearlseafood.com";
const PASS = "OceanPearl2026!";

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
    if (j.idToken) return j.idToken;
    throw new Error("Auth failed: " + JSON.stringify(j));
}

async function readCollection(collection, token) {
    const res = await request({
        hostname: FIRESTORE_HOST,
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=1`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return { status: res.status, ...json(res) };
}

async function run() {
    console.log("🔒 TEST: FIRESTORE RULES LOCKDOWN");

    // 1. Authenticate
    const token = await getIdToken(EMAIL, PASS);
    console.log(`Authenticated as ${EMAIL}`);

    // 2. Test Allowed (Metadata)
    console.log("\n[TEST] Reading 'units' (Should Allow)...");
    const r1 = await readCollection("units", token);
    if (r1.status === 200) console.log("✅ PASS: 'units' -> 200 OK");
    else console.error("❌ FAIL: 'units' -> " + r1.status);

    // 3. Test Denied (Inventory)
    console.log("\n[TEST] Reading 'inventory_lots' (Should Deny)...");
    const r2 = await readCollection("inventory_lots", token);
    if (r2.status === 403) console.log("✅ PASS: 'inventory_lots' -> 403 PERMISSION DENIED");
    else console.error("❌ FAIL: 'inventory_lots' -> " + r2.status);

    // 4. Test Denied (Ledger)
    console.log("\n[TEST] Reading 'ledger_entries' (Should Deny)...");
    const r3 = await readCollection("ledger_entries", token);
    if (r3.status === 403) console.log("✅ PASS: 'ledger_entries' -> 403 PERMISSION DENIED");
    else console.error("❌ FAIL: 'ledger_entries' -> " + r3.status);

    // 5. Test Denied (Shark Views)
    console.log("\n[TEST] Reading 'shark_view_wallets' (Should Deny)...");
    const r4 = await readCollection("shark_view_wallets", token);
    if (r4.status === 403) console.log("✅ PASS: 'shark_view_wallets' -> 403 PERMISSION DENIED");
    else console.error("❌ FAIL: 'shark_view_wallets' -> " + r4.status);
}

run().catch(console.error);
