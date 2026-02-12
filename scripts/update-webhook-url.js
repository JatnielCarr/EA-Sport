#!/usr/bin/env node

/**
 * Script para actualizar la URL del webhook existente en Stripe
 */

const https = require('https');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_ID = 'we_1SwZbvRrthiCDord1D5hJqUO';

if (!STRIPE_SECRET_KEY || !WEBHOOK_URL) {
    console.error('❌ Error: Faltan variables de entorno');
    process.exit(1);
}

console.log('🔧 Actualizando webhook en Stripe...');
console.log(`📡 Nueva URL: ${WEBHOOK_URL}`);

const formData = new URLSearchParams({
    url: WEBHOOK_URL
});

const options = {
    hostname: 'api.stripe.com',
    port: 443,
    path: `/v1/webhook_endpoints/${WEBHOOK_ID}`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData.toString())
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            const webhook = JSON.parse(data);
            console.log('✅ Webhook actualizado exitosamente!');
            console.log(`🔑 Webhook ID: ${webhook.id}`);
            console.log(`📡 URL: ${webhook.url}`);
            console.log('\n🚀 ¡Tu servidor local está listo para recibir webhooks de Stripe!');
        } else {
            console.error(`❌ Error ${res.statusCode}: ${data}`);
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});

req.write(formData.toString());
req.end();
