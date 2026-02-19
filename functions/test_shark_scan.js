
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
    throw new Error("Auth failed: " + JSON.stringify(j));
}

async function createDoc(collection, id, fields) {
    const data = JSON.stringify({ fields });
    const path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}` + (id ? `?documentId=${id}` : '');
    const res = await request({
        hostname: FIRESTORE_HOST, port: FIRESTORE_PORT,
        path: path,
        method: 'POST',
        headers: { 'Authorization': 'Bearer owner', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    return res.status;
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
    console.log("🦈 SHARK AI SCAN TEST");
    console.log("=====================");

    // 1. Auth
    console.log("\n1. Authenticating...");
    const { token, uid } = await getIdToken("ceo@oceanpearlseafood.com", "OceanPearl2026!");
    console.log(`   UID: ${uid}`);

    // 2. Seed Data
    console.log("\n2. Seeding problematic data...");

    // A. Negative Inventory
    const negLotId = `lot_neg_${Date.now()}`;
    await createDoc("inventory_lots", negLotId, {
        unitId: { stringValue: "unit_test" },
        quantityKg: { doubleValue: -10.5 },
        status: { stringValue: "IN_STOCK" },
        costPerKg: { doubleValue: 100 },
        speciesId: { stringValue: "TEST_SPC" },
        productSpecId: { stringValue: "TEST_SPEC" }
    });
    console.log(`   Created negative lot: ${negLotId}`);

    // B. Lot without Ledger (orphaned)
    const orphanLotId = `lot_orphan_${Date.now()}`;
    await createDoc("inventory_lots", orphanLotId, {
        unitId: { stringValue: "unit_test" },
        quantityKg: { doubleValue: 50 },
        status: { stringValue: "IN_STOCK" },
        costPerKg: { doubleValue: 100 },
        speciesId: { stringValue: "TEST_SPC" },
        productSpecId: { stringValue: "TEST_SPEC" }
    });
    console.log(`   Created orphaned lot: ${orphanLotId}`);

    // C. Outlier COGS (Need 3+ lots same species)
    // Create 3 normal lots
    for (let i = 0; i < 3; i++) {
        await createDoc("inventory_lots", `lot_norm_${i}_${Date.now()}`, {
            unitId: { stringValue: "unit_test" },
            quantityKg: { doubleValue: 10 },
            costPerKg: { doubleValue: 100 }, // Median will be 100
            speciesId: { stringValue: "OUTLIER_TEST_SPC" },
            productSpecId: { stringValue: "TEST_SPEC" }
        });
    }
    // Create 1 outlier lot (200 > 1.3 * 100)
    const outlierLotId = `lot_outlier_${Date.now()}`;
    await createDoc("inventory_lots", outlierLotId, {
        unitId: { stringValue: "unit_test" },
        quantityKg: { doubleValue: 10 },
        costPerKg: { doubleValue: 200 },
        speciesId: { stringValue: "OUTLIER_TEST_SPC" },
        productSpecId: { stringValue: "TEST_SPEC" }
    });
    console.log(`   Created outlier lot: ${outlierLotId}`);

    // D. Missing Fields
    const missingLotId = `lot_missing_${Date.now()}`;
    await createDoc("inventory_lots", missingLotId, {
        // unitId missing
        quantityKg: { doubleValue: 10 },
        costPerKg: { doubleValue: 100 },
        speciesId: { stringValue: "TEST_SPC" }
    });
    console.log(`   Created lot with missing fields: ${missingLotId}`);

    // 3. Run Scan
    console.log("\n3. Running Shark Scan...");
    const result = await callFunction("sharkRunScan", token, { scope: {} });

    console.log("\n4. Scan Results:");
    if (result.result && result.result.success) {
        console.log(`   Alerts Generated: ${result.result.alertsGenerated}`);
        console.log(`   Summary:`, result.result.summary);

        // Let's list the alerts (need to query Firestore or just trust the summary count for now)
        // Ideally we'd query shark_alerts to verify content, but summary count > 0 is good sign.
        if (result.result.alertsGenerated >= 4) {
            console.log("\n✅ SUCCESS: Alerts generated successfully.");
        } else {
            console.log("\n⚠️ WARNING: Fewer alerts than expected.");
        }
    } else {
        console.log("\n❌ FAILED:");
        console.log(JSON.stringify(result, null, 2));
    }

    console.log("\n=====================");
}

run().catch(e => console.error("FATAL:", e));
