/**
 * PRODUCTION REGRESSION SMOKE TEST
 * Tests receiveLot, recordSale, recordPayment, getTrialBalance against LIVE production
 */
const https = require("https");

const PROJECT_ID = "oceanpearl-ops";
const REGION = "asia-southeast1";
const API_KEY = "AIzaSyBmvJvv5ydL8Ygq4kKwxLNqrqGzgPNhZXQ";
const BASE_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

// CEO credentials
const EMAIL = "ceo@oceanpearlseafood.com";
const PASSWORD = "OceanPearl2026!";

function httpRequest(url, method, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method,
            headers: { "Content-Type": "application/json", ...headers }
        };
        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on("error", reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function getIdToken() {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const res = await httpRequest(url, "POST", {
        email: EMAIL,
        password: PASSWORD,
        returnSecureToken: true
    });
    if (!res.data.idToken) throw new Error("Auth failed: " + JSON.stringify(res.data));
    return res.data.idToken;
}

async function callFunction(name, data, token) {
    const url = `${BASE_URL}/${name}`;
    const res = await httpRequest(url, "POST", { data }, {
        Authorization: `Bearer ${token}`
    });
    return res;
}

async function main() {
    console.log("🔥 PRODUCTION REGRESSION SMOKE TEST");
    console.log("====================================\n");

    // Auth
    console.log("1. Authenticating as CEO...");
    const token = await getIdToken();
    console.log("   ✅ Token obtained\n");

    const ts = Date.now();
    let passed = 0;
    let failed = 0;

    // Test 1: receiveLot
    console.log("2. Testing receiveLot...");
    try {
        const res = await callFunction("receiveLot", {
            unitId: "unit_001",
            speciesId: "TUNA",
            productSpecId: "WHOLE_ROUND",
            quantityKg: 50,
            pricePerKg: 25000,
            currency: "IDR",
            supplierId: "supplier_smoke_test",
            locationId: "loc_001"
        }, token);
        if (res.data && res.data.result && res.data.result.success) {
            console.log(`   ✅ receiveLot SUCCESS: lotId=${res.data.result.lotId}`);
            passed++;
        } else {
            console.log(`   ❌ receiveLot FAILED: ${JSON.stringify(res.data)}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ receiveLot ERROR: ${e.message}`);
        failed++;
    }

    // Test 2: recordSale  
    console.log("\n3. Testing recordSale...");
    try {
        const res = await callFunction("recordSale", {
            saleId: `sale_smoke_${ts}`,
            lotIds: [`lot_smoke_${ts}`],
            customerName: "Smoke Test Customer",
            pricePerKg: 35000,
            currency: "IDR",
            quantityKg: 10,
            unitId: "unit_001"
        }, token);
        if (res.data && res.data.result && res.data.result.success) {
            console.log(`   ✅ recordSale SUCCESS: saleId=${res.data.result.saleId}`);
            passed++;
        } else {
            console.log(`   ❌ recordSale FAILED: ${JSON.stringify(res.data)}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ recordSale ERROR: ${e.message}`);
        failed++;
    }

    // Test 3: recordPayment
    console.log("\n4. Testing recordPayment...");
    try {
        const res = await callFunction("recordPayment", {
            paymentId: `pay_smoke_${ts}`,
            unitId: "unit_001",
            amount: 500000,
            currency: "IDR",
            type: "payment",
            description: "Smoke test payment"
        }, token);
        if (res.data && res.data.result && res.data.result.success) {
            console.log(`   ✅ recordPayment SUCCESS: paymentId=${res.data.result.paymentId}`);
            passed++;
        } else {
            console.log(`   ❌ recordPayment FAILED: ${JSON.stringify(res.data)}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ recordPayment ERROR: ${e.message}`);
        failed++;
    }

    // Test 4: getTrialBalance
    console.log("\n5. Testing getTrialBalance...");
    try {
        const res = await callFunction("getTrialBalance", {}, token);
        if (res.data && res.data.result) {
            const result = res.data.result;
            console.log(`   ✅ getTrialBalance SUCCESS: entries=${result.entries ? result.entries.length : 'N/A'}`);
            passed++;
        } else {
            console.log(`   ❌ getTrialBalance FAILED: ${JSON.stringify(res.data)}`);
            failed++;
        }
    } catch (e) {
        console.log(`   ❌ getTrialBalance ERROR: ${e.message}`);
        failed++;
    }

    console.log("\n====================================");
    console.log(`RESULTS: ${passed} passed, ${failed} failed out of 4`);
    if (failed === 0) {
        console.log("✅ ALL REGRESSION TESTS PASSED");
    } else {
        console.log("❌ SOME TESTS FAILED");
    }
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
