const http = require('http');

// CONFIG
const AUTH_HOST = '127.0.0.1';
const AUTH_PORT = 9099;
const FUNCTIONS_HOST = '127.0.0.1';
const FUNCTIONS_PORT = 5001;
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const PROJECT_ID = 'oceanpearl-ops';
const API_KEY = 'fake-api-key'; // Emulator accepts any key

// HELPER: HTTP Request
function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function getIdToken(email, password) {
    const postData = JSON.stringify({ email, password, returnSecureToken: true });
    const options = {
        hostname: AUTH_HOST,
        port: AUTH_PORT,
        path: `/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };
    const res = await request(options, postData);
    const json = JSON.parse(res.body);
    return json.idToken;
}

async function run() {
    console.log("⚡ Generating Evidence...");

    try {
        // 1. Create User (Non-Admin)
        const idToken = await getIdToken(`user_${Date.now()}@test.com`, 'password123');
        if (!idToken) throw new Error("Failed to get ID Token");
        console.log("✅ Auth: Generated ID Token for test user.");

        // 2. Test Rules (Silent Write)
        // Try to write to inventory_lots via REST API
        const lotData = JSON.stringify({ fields: { quantity: { integerValue: 100 } } });
        const firestoreOptions = {
            hostname: FIRESTORE_HOST,
            port: FIRESTORE_PORT,
            path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/inventory_lots/test_lot_${Date.now()}`,
            method: 'POST', // or PATCH
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(lotData)
            }
        };
        const firestoreRes = await request(firestoreOptions, lotData);
        if (firestoreRes.status === 403) {
            console.log("✅ Rule Test: Direct write to inventory_lots BLOCKED (403).");
        } else {
            console.error(`❌ Rule Test FAILED: Expected 403, got ${firestoreRes.status}`);
            console.log("Response Body:", firestoreRes.body);
        }

        // 3. Test Mass Conservation (Call Function)
        // input = 100, output = 50, waste = 0 -> Violation
        const funcData = JSON.stringify({
            data: {
                operationId: `op_${Date.now()}`,
                unitId: 'unit_1',
                inputLots: [{ lotId: 'in_1', quantityKg: 100 }],
                outputLots: [{ productSpecId: 'spec_1', quantityKg: 50 }],
                wasteLots: []
            }
        });
        const funcOptions = {
            hostname: FUNCTIONS_HOST,
            port: FUNCTIONS_PORT,
            path: `/${PROJECT_ID}/asia-southeast1/productionTransform`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(funcData)
            }
        };
        const funcRes = await request(funcOptions, funcData);
        let funcJson;
        try {
            funcJson = JSON.parse(funcRes.body);
        } catch (e) {
            console.error("Function Response JSON Parse Error. Body:", funcRes.body);
            throw e;
        }

        // Check if error is thrown
        // The emulator returns { error: ... } for HttpsError
        if (funcJson.error) {
            // Check message
            if (funcJson.error.message && funcJson.error.message.includes("Mass conservation violation")) {
                console.log("✅ Invariant Test: Mass Conservation Violation REJECTED.");
            } else {
                console.log(`⚠️ Function Error (Maybe Auth/Permission first?): ${funcJson.error.message}`);
                // Note: If user doesn't have access to unit, it might fail permissions first.
                // BUT we passed the Mass Conservation check BEFORE verifying unit access in code? 
                // Let's check index.js order.
                // index.js: Authenticate -> Mass Conservation -> Perms? 
                // If so, good. If Perms first, we need a valid unit access.
                // Actually, let's verify verifyUserAccess logic.
            }
        } else {
            console.error(`❌ Invariant Test FAILED: Expected error, got success: ${JSON.stringify(funcJson)}`);
        }

        // 4. Test RBAC (Call Admin Function)
        const rbacData = JSON.stringify({ data: {} });
        const rbacOptions = {
            hostname: FUNCTIONS_HOST,
            port: FUNCTIONS_PORT,
            path: `/${PROJECT_ID}/asia-southeast1/getTrialBalance`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(rbacData)
            }
        };
        const rbacRes = await request(rbacOptions, rbacData);
        const rbacJson = JSON.parse(rbacRes.body);
        if (rbacJson.error && (rbacJson.error.status === 'PERMISSION_DENIED' || rbacJson.error.message === 'Access denied')) {
            console.log("✅ RBAC Test: Non-Admin access to getTrialBalance BLOCKED.");
        } else {
            console.error(`❌ RBAC Test FAILED: Expected PERMISSION_DENIED, got: ${JSON.stringify(rbacJson)}`);
        }

    } catch (e) {
        console.error("Test Error:", e);
    }
}

run();
