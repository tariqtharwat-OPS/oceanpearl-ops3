const axios = require('axios');

async function testEndpoints() {
    const baseUrl = 'http://127.0.0.1:5001/oceanpearl-ops/asia-southeast1';

    const endpoints = [
        '/health-healthz',
        '/health-readyz'
    ];

    for (const ep of endpoints) {
        try {
            console.log(`Testing ${ep}...`);
            const res = await axios.get(baseUrl + ep);
            console.log(`RES: ${JSON.stringify(res.data)}`);
        } catch (e) {
            console.log(`ERR ${ep}: ${e.message}`);
            if (e.response) console.log(`STATUS: ${e.response.status} DATA: ${JSON.stringify(e.response.data)}`);
        }
    }
}

testEndpoints();
