const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

async function testEndpoints() {
    const baseUrl = 'http://127.0.0.1:5001/oceanpearl-ops/asia-southeast1';

    const endpoints = [
        '/health-healthz',
        '/health-readyz'
    ];

    for (const ep of endpoints) {
        try {
            console.log(`Testing ${ep}...`);
            const { status, body } = await get(baseUrl + ep);
            console.log(`STATUS: ${status} BODY: ${body}`);
        } catch (e) {
            console.log(`ERR ${ep}: ${e.message}`);
        }
    }
}

testEndpoints();
