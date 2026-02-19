const admin = require('firebase-admin');
const axios = require('axios');

async function testCall() {
    console.log('--- recordReceiving PROOF ---');
    const payload = {
        idempotencyKey: 'proof-recv-' + Date.now(),
        locationId: 'LOC-KAI',
        unitId: 'UNIT-BOAT-1',
        skuId: 'ANCH-FRESH',
        qtyKg: 100,
        unitCostIDR: 5000,
        supplierName: 'Proof Supplier',
        vesselName: 'Proof Vessel'
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const res = await axios.post('http://127.0.0.1:5001/oceanpearl-ops/asia-southeast1/workflows-recordReceiving', { data: payload }, {
            headers: { 'Authorization': 'Bearer owner' } // Mock auth for emulator if needed, or use a real token
        });
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.log('Response:', JSON.stringify(err.response?.data || err.message, null, 2));
    }
}

testCall();
