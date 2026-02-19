
const https = require('https');

const FUNCTIONS_HOST = 'asia-southeast1-oceanpearl-ops.cloudfunctions.net';
const AUTH_HOST = 'identitytoolkit.googleapis.com';
const PROJECT_ID = 'oceanpearl-ops';
// From .env
const API_KEY = 'AIzaSyBmHSr7huWpMZa9RnKNBgV6fnXltmvsxcc';

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
    // Try login
    let res = await request({
        hostname: AUTH_HOST,
        path: `/v1/accounts:signInWithPassword?key=${API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(d),
            'Referer': 'https://oceanpearl-ops.web.app',
            'Origin': 'https://oceanpearl-ops.web.app'
        }
    }, d);
    let j = json(res);
    if (j.idToken) return { token: j.idToken, uid: j.localId };
    throw new Error("Auth failed: " + JSON.stringify(j));
}

// Helper to call function via HTTPS (callable protocol)
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
    console.log("🦈 SHARK AI CHAT TEST (PRODUCTION)");
    console.log("==================================");

    // 1. Auth as CEO
    console.log("\n1. Authenticating as CEO...");
    // Use real credentials
    const { token, uid } = await getIdToken("ceo@oceanpearlseafood.com", "OceanPearl2026!");
    console.log(`   UID: ${uid}`);

    // 2. Chat with Shark
    const queries = [
        "What are the active alerts right now?",
        "How much YFT do we have in total?"
    ];

    for (const q of queries) {
        console.log(`\n2. Asking: "${q}"...`);
        const result = await callFunction("sharkChat", token, { message: q });

        console.log("   --- RESPONSE ---");
        if (result.result && result.result.response) {
            console.log(result.result.response);
            if (!result.result.response.includes("I will analyze that for you")) {
                console.log("\n✅ SUCCESS: Intelligent response received.");
            }
        } else {
            console.log("\n❌ FAILED:");
            console.log(JSON.stringify(result, null, 2));
        }
    }

    console.log("\n==================================");
}

run().catch(e => console.error("FATAL:", e));
