
const fetch = require('node-fetch');

async function testN8n() {
    const url = 'http://localhost:5678/webhook/send-invitation';
    console.log(`Testing connection to ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatId: '123456789', // Dummy ID
                message: 'Test message from script',
                replyMarkup: {}
            })
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

        if (response.ok) {
            console.log('✅ Connection Successful! The workflow is active and reachable.');
        } else {
            console.log('❌ Connection Failed.');
            if (response.status === 404) {
                console.log('👉 Cause: The workflow might not be ACTIVE in n8n. Please open n8n, open the workflow, and toggle "Active" to true (top right).');
            }
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
        console.log('👉 Cause: n8n might not be running or the port is blocked.');
    }
}

testN8n();
