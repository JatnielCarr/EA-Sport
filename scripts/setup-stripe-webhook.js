#!/usr/bin/env node

/**
 * =====================================================
 * STRIPE WEBHOOK CONFIGURATION SCRIPT
 * =====================================================
 * Configura automáticamente el webhook endpoint en Stripe
 * para procesar pagos automáticamente.
 *
 * Uso: npm run setup-webhook
 */

const https = require('https');
const { execSync } = require('child_process');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY no está configurado');
    console.log('Configura tu clave secreta de Stripe en las variables de entorno');
    process.exit(1);
}

if (!WEBHOOK_URL) {
    console.error('❌ Error: WEBHOOK_URL no está configurado');
    console.log('');
    console.log('Para desarrollo local, necesitas exponer tu servidor:');
    console.log('1. Instala ngrok: npm install -g ngrok');
    console.log('2. Regístrate en https://ngrok.com y obtén tu authtoken');
    console.log('3. Ejecuta: ngrok http 3000');
    console.log('4. Copia la URL HTTPS que ngrok te da');
    console.log('5. Configura WEBHOOK_URL en tu .env con esa URL');
    console.log('');
    console.log('Ejemplo: WEBHOOK_URL=https://abc123.ngrok.io/stripe/webhook');
    process.exit(1);
}

console.log('🔧 Configurando webhook endpoint en Stripe...');
console.log(`📡 URL del webhook: ${WEBHOOK_URL}`);

// Eventos que necesitamos para el procesamiento automático de pagos
const WEBHOOK_EVENTS = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
];

async function createWebhook() {
    // Convertir a form data para Stripe API
    const formData = new URLSearchParams({
        url: WEBHOOK_URL,
        description: 'EA Sports Tournament Platform - Payment Processing'
    });

    // Agregar cada evento como un campo separado
    WEBHOOK_EVENTS.forEach(event => {
        formData.append('enabled_events[]', event);
    });

    const options = {
        hostname: 'api.stripe.com',
        port: 443,
        path: '/v1/webhook_endpoints',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(formData.toString())
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    const webhook = JSON.parse(data);
                    resolve(webhook);
                } else {
                    reject(new Error(`Error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(formData.toString());
        req.end();
    });
}

async function listWebhooks() {
    const options = {
        hostname: 'api.stripe.com',
        port: 443,
        path: '/v1/webhook_endpoints',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    const webhooks = JSON.parse(data);
                    resolve(webhooks.data);
                } else {
                    reject(new Error(`Error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function deleteWebhook(webhookId) {
    const options = {
        hostname: 'api.stripe.com',
        port: 443,
        path: `/v1/webhook_endpoints/${webhookId}`,
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function main() {
    try {
        console.log('🔍 Verificando webhooks existentes...');

        // Listar webhooks existentes
        const existingWebhooks = await listWebhooks();

        // Filtrar webhooks que apuntan a nuestra URL
        const ourWebhooks = existingWebhooks.filter(wh => wh.url === WEBHOOK_URL);

        if (ourWebhooks.length > 0) {
            console.log(`⚠️ Encontrados ${ourWebhooks.length} webhook(s) existente(s) para esta URL`);

            // Eliminar webhooks existentes
            for (const webhook of ourWebhooks) {
                console.log(`🗑️ Eliminando webhook existente: ${webhook.id}`);
                await deleteWebhook(webhook.id);
            }
        }

        // Crear nuevo webhook
        console.log('✨ Creando nuevo webhook endpoint...');
        const webhook = await createWebhook();

        console.log('✅ Webhook configurado exitosamente!');
        console.log(`🔑 Webhook ID: ${webhook.id}`);
        console.log(`🔐 Webhook Secret: ${webhook.secret}`);
        console.log('');
        console.log('📋 IMPORTANTE: Copia el webhook secret y configúralo en tu archivo .env:');
        console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
        console.log('');
        console.log('🎯 Eventos configurados:');
        WEBHOOK_EVENTS.forEach(event => console.log(`   - ${event}`));
        console.log('');
        console.log('🚀 El webhook está listo para procesar pagos automáticamente!');

    } catch (error) {
        console.error('❌ Error configurando webhook:', error.message);
        console.log('');
        console.log('💡 Solución: Verifica que:');
        console.log('   1. Tu STRIPE_SECRET_KEY sea correcta');
        console.log('   2. Tu servidor esté ejecutándose en la URL especificada');
        console.log('   3. La URL sea accesible desde internet (para producción)');
        process.exit(1);
    }
}

main();