
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, url) {
    console.log(`Testing ${name} (${url})...`);
    try {
        const res = await fetch(url);
        if (res.ok) {
            console.log(`✅ ${name}: OK`);
        } else {
            console.log(`❌ ${name}: Failed (${res.status})`);
            const text = await res.text();
            console.log('Response:', text.substring(0, 200));
        }
    } catch (err) {
        console.log(`❌ ${name}: Error - ${err.message}`);
    }
}

async function run() {
    await testEndpoint('Tournaments', `${BASE_URL}/tournaments`);
    await testEndpoint('Teams', `${BASE_URL}/teams`);
    await testEndpoint('Matches', `${BASE_URL}/matches`);
}

run();
