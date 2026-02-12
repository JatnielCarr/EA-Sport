/**
 * Script para actualizar precios en Stripe
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-09-30.acacia'
});

async function updatePrices() {
    console.log('🚀 Actualizando precios en Stripe...\n');

    // Buscar productos existentes
    const products = await stripe.products.list({ limit: 10 });

    let premiumProduct = products.data.find(p => p.metadata?.plan === 'PREMIUM');

    // Si no existen, crearlos
    if (!premiumProduct) {
        console.log('📦 Creando producto PREMIUM...');
        premiumProduct = await stripe.products.create({
            name: 'ApexTournament Premium',
            description: 'Todo lo de Pro más torneos exclusivos, coaching personalizado y acceso anticipado.',
            metadata: { plan: 'PREMIUM' }
        });
    }

    // Crear nuevos precios PREMIUM
    console.log('\n💵 Creando precio PREMIUM Mensual ($999 MXN/mes)...');
    const premiumMonthly = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 99900, // $999.00 MXN
        currency: 'mxn',
        recurring: { interval: 'month' },
        metadata: { plan: 'PREMIUM', interval: 'monthly' }
    });
    console.log(`   ✅ ${premiumMonthly.id}`);

    console.log('💵 Creando precio PREMIUM Anual ($9,990 MXN/año)...');
    const premiumYearly = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 999000, // $9,990.00 MXN
        currency: 'mxn',
        recurring: { interval: 'year' },
        metadata: { plan: 'PREMIUM', interval: 'yearly' }
    });
    console.log(`   ✅ ${premiumYearly.id}`);

    // Actualizar .env
    console.log('\n📝 Actualizando archivo .env...');
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    envContent = envContent.replace(/STRIPE_PREMIUM_MONTHLY_PRICE_ID=.*$/m, `STRIPE_PREMIUM_MONTHLY_PRICE_ID=${premiumMonthly.id}`);
    envContent = envContent.replace(/STRIPE_PREMIUM_YEARLY_PRICE_ID=.*$/m, `STRIPE_PREMIUM_YEARLY_PRICE_ID=${premiumYearly.id}`);

    fs.writeFileSync(envPath, envContent);
    console.log('   ✅ .env actualizado');

    console.log('\n' + '═'.repeat(50));
    console.log('   ✅ PRECIOS ACTUALIZADOS');
    console.log('═'.repeat(50));
    console.log('\nNuevos precios:');
    console.log(`  PREMIUM Mensual: $999 MXN - ${premiumMonthly.id}`);
    console.log(`  PREMIUM Anual:   $9,990 MXN - ${premiumYearly.id}`);
    console.log('\n🎉 ¡Listo! Reinicia el servidor para aplicar los cambios.');
}

updatePrices().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
