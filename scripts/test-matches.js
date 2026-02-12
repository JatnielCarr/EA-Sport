
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testMatches() {
    console.log(`Testing Matches (${BASE_URL}/matches)...`);
    try {
        const res = await fetch(`${BASE_URL}/matches`);
        if (res.ok) {
            console.log(`✅ Matches: OK`);
        } else {
            console.log(`❌ Matches: Failed (${res.status})`);
            const json = await res.json();
            console.log('Error JSON:', JSON.stringify(json, null, 2));
        }
    } catch (err) {
        console.log(`❌ Matches: Error - ${err.message}`);
    }
}

testMatches();
