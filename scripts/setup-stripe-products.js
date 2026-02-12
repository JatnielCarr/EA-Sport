/**
 * Script para crear productos y precios en Stripe automáticamente
 * Ejecutar con: node scripts/setup-stripe-products.js
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-09-30.acacia'
});

async function createProducts() {
    console.log('🚀 Creando productos en Stripe...\n');



    // Crear producto PREMIUM
    console.log('\n📦 Creando producto PREMIUM...');
    const premiumProduct = await stripe.products.create({
        name: 'ApexTournament Premium',
        description: 'Todo lo de Standard más torneos exclusivos, badge legendario y acceso anticipado.',
        metadata: { plan: 'PREMIUM' }
    });
    console.log(`   ✅ Producto creado: ${premiumProduct.id}`);

    // Precio PREMIUM Mensual
    console.log('   💵 Creando precio mensual ($999 MXN/mes)...');
    const premiumMonthly = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 99900,
        currency: 'mxn',
        recurring: { interval: 'month' },
        metadata: { plan: 'PREMIUM', interval: 'monthly' }
    });
    console.log(`   ✅ Precio mensual: ${premiumMonthly.id}`);

    // Precio PREMIUM Anual
    console.log('   💵 Creando precio anual ($9990 MXN/año)...');
    const premiumYearly = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 999000,
        currency: 'mxn',
        recurring: { interval: 'year' },
        metadata: { plan: 'PREMIUM', interval: 'yearly' }
    });
    console.log(`   ✅ Precio anual: ${premiumYearly.id}`);

    return {
        STRIPE_PREMIUM_MONTHLY_PRICE_ID: premiumMonthly.id,
        STRIPE_PREMIUM_YEARLY_PRICE_ID: premiumYearly.id
    };
}

async function updateEnvFile(priceIds) {
    console.log('\n📝 Actualizando archivo .env...');

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Actualizar cada Price ID
    envContent = envContent.replace(/STRIPE_PREMIUM_MONTHLY_PRICE_ID=.*$/m, `STRIPE_PREMIUM_MONTHLY_PRICE_ID=${priceIds.STRIPE_PREMIUM_MONTHLY_PRICE_ID}`);
    envContent = envContent.replace(/STRIPE_PREMIUM_YEARLY_PRICE_ID=.*$/m, `STRIPE_PREMIUM_YEARLY_PRICE_ID=${priceIds.STRIPE_PREMIUM_YEARLY_PRICE_ID}`);

    fs.writeFileSync(envPath, envContent);
    console.log('   ✅ Archivo .env actualizado');
}

async function main() {
    console.log('═'.repeat(50));
    console.log('   CONFIGURACIÓN DE STRIPE - ApexTournament');
    console.log('═'.repeat(50));
    console.log('');

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ Error: STRIPE_SECRET_KEY no está configurada en .env');
        process.exit(1);
    }

    try {
        const priceIds = await createProducts();
        await updateEnvFile(priceIds);

        console.log('\n' + '═'.repeat(50));
        console.log('   ✅ CONFIGURACIÓN COMPLETADA');
        console.log('═'.repeat(50));
        console.log('\nPrice IDs creados:');
        console.log(`  PREMIUM Mensual: ${priceIds.STRIPE_PREMIUM_MONTHLY_PRICE_ID}`);
        console.log(`  PREMIUM Anual:   ${priceIds.STRIPE_PREMIUM_YEARLY_PRICE_ID}`);
        console.log('\n🎉 ¡Listo! Reinicia el servidor para aplicar los cambios.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
