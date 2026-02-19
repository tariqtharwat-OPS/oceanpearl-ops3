const http = require('http');

const FUNCTIONS_HOST = '127.0.0.1';
const FUNCTIONS_PORT = 5001;
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const AUTH_HOST = '127.0.0.1';
const AUTH_PORT = 9099;
const PROJECT_ID = 'oceanpearl-ops';
const API_KEY = 'fake-api-key';

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
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
    // Try login
    let res = await request({
        hostname: AUTH_HOST, port: AUTH_PORT,
        path: `/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) }
    }, d);
    let j = json(res);
    if (j.idToken) return { token: j.idToken, uid: j.localId };

    // Sign up
    res = await request({
        hostname: AUTH_HOST, port: AUTH_PORT,
        path: `/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) }
    }, d);
    j = json(res);
    if (j.idToken) return { token: j.idToken, uid: j.localId };
    throw new Error("Auth failed: " + JSON.stringify(j));
}

async function ensureUserDoc(uid) {
    // Create user doc with CEO role using Bearer owner (admin bypass)
    const data = JSON.stringify({
        fields: {
            email: { stringValue: "ceo@oceanpearlseafood.com" },
            displayName: { stringValue: "CEO" },
            role: { stringValue: "CEO" },
            allowedLocations: { arrayValue: { values: [] } },
            allowedUnits: { arrayValue: { values: [] } }
        }
    });
    const res = await request({
        hostname: FIRESTORE_HOST, port: FIRESTORE_PORT,
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?documentId=${uid}`,
        method: 'POST',
        headers: { 'Authorization': 'Bearer owner', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    console.log(`   User doc create: ${res.status}`);
}

async function createSuggestion(uid) {
    const suggestionId = `sugg_${Date.now()}`;
    const data = JSON.stringify({
        fields: {
            userId: { stringValue: uid },
            status: { stringValue: "DRAFT" },
            proposedPayload: {
                mapValue: {
                    fields: {
                        unitId: { stringValue: "unit_boat1" },
                        speciesId: { stringValue: "YFT" },
                        productSpecId: { stringValue: "WHOLE_ROUND" },
                        quantity: { integerValue: "50" },
                        cost: { integerValue: "2500000" },
                        locationId: { stringValue: "loc_kaimana" },
                        currency: { stringValue: "IDR" }
                    }
                }
            },
            createdTs: { timestampValue: new Date().toISOString() }
        }
    });

    const res = await request({
        hostname: FIRESTORE_HOST, port: FIRESTORE_PORT,
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/shark_suggestions?documentId=${suggestionId}`,
        method: 'POST',
        headers: { 'Authorization': 'Bearer owner', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    console.log(`   Suggestion create: ${res.status}`);
    if (res.status !== 200) {
        console.error("   Create response:", res.body.substring(0, 300));
    }
    return suggestionId;
}

async function callFunction(name, token, payload) {
    const data = JSON.stringify({ data: payload });
    const res = await request({
        hostname: FUNCTIONS_HOST, port: FUNCTIONS_PORT,
        path: `/${PROJECT_ID}/asia-southeast1/${name}`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    return { status: res.status, ...json(res) };
}

async function run() {
    console.log("🦈 SHARK AI ATOMIC TEST");
    console.log("========================");

    // 1. Auth
    console.log("\n1. Authenticating as CEO...");
    const { token, uid } = await getIdToken("ceo@oceanpearlseafood.com", "OceanPearl2026!");
    console.log(`   UID: ${uid}`);

    // 2. Ensure user doc exists with CEO role
    console.log("\n2. Ensuring CEO user doc...");
    await ensureUserDoc(uid);

    // 3. Create suggestion
    console.log("\n3. Creating suggestion...");
    const suggestionId = await createSuggestion(uid);
    console.log(`   ID: ${suggestionId}`);

    // 4. Confirm suggestion (atomic: lot + ledger + status update)
    console.log("\n4. Confirming suggestion (atomic write)...");
    const result = await callFunction("sharkUpdateSuggestion", token, {
        suggestionId, status: "confirmed", feedback: "Test confirm"
    });

    if (result.result && result.result.success) {
        console.log("\n✅ SUCCESS: Atomic write completed!");
        console.log(`   Lot ID:    ${result.result.lotId}`);
        console.log(`   Ledger ID: ${result.result.ledgerEntryId}`);
    } else {
        console.log("\n❌ FAILED:");
        console.log(JSON.stringify(result, null, 2));
    }

    // 5. Test reject flow
    console.log("\n5. Testing reject flow...");
    const suggestionId2 = await createSuggestion(uid);
    const rejectResult = await callFunction("sharkUpdateSuggestion", token, {
        suggestionId: suggestionId2, status: "rejected", feedback: "Not needed"
    });
    if (rejectResult.result && rejectResult.result.success) {
        console.log("✅ Reject flow works.");
    } else {
        console.log("❌ Reject failed:", JSON.stringify(rejectResult, null, 2));
    }

    console.log("\n========================");
    console.log("DONE");
}

run().catch(e => console.error("FATAL:", e));
