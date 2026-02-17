/**
 * Script para crear productos y precios en Stripe automáticamente
 * Ejecutar con: npx ts-node scripts/setup-stripe-products.ts
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover'
});

interface PriceIds {
    STRIPE_STANDARD_MONTHLY_PRICE_ID: string;
    STRIPE_STANDARD_YEARLY_PRICE_ID: string;
    STRIPE_PREMIUM_MONTHLY_PRICE_ID: string;
    STRIPE_PREMIUM_YEARLY_PRICE_ID: string;
}

async function createProducts(): Promise<PriceIds> {
    console.log('🚀 Creando productos en Stripe...\n');

    // Crear producto STANDARD
    console.log('📦 Creando producto STANDARD...');
    const standardProduct = await stripe.products.create({
        name: 'ApexTournament Standard',
        description: 'Plan Standard: crea y administra torneos, hasta 16 jugadores y 3 torneos activos.',
        metadata: {
            plan: 'STANDARD'
        }
    });
    console.log(`   ✅ Producto creado: ${standardProduct.id}`);

    // Precio STANDARD Mensual
    console.log('   💵 Creando precio mensual ($499 MXN/mes)...');
    const standardMonthly = await stripe.prices.create({
        product: standardProduct.id,
        unit_amount: 49900, // $499.00 MXN en centavos
        currency: 'mxn',
        recurring: {
            interval: 'month'
        },
        metadata: {
            plan: 'STANDARD',
            interval: 'monthly'
        }
    });
    console.log(`   ✅ Precio mensual: ${standardMonthly.id}`);

    // Precio STANDARD Anual
    console.log('   💵 Creando precio anual ($4,990 MXN/año)...');
    const standardYearly = await stripe.prices.create({
        product: standardProduct.id,
        unit_amount: 499000, // $4,990.00 MXN en centavos
        currency: 'mxn',
        recurring: {
            interval: 'year'
        },
        metadata: {
            plan: 'STANDARD',
            interval: 'yearly'
        }
    });
    console.log(`   ✅ Precio anual: ${standardYearly.id}`);

    // Crear producto PREMIUM
    console.log('\n📦 Creando producto PREMIUM...');
    const premiumProduct = await stripe.products.create({
        name: 'ApexTournament Premium',
        description: 'Plan Premium: hasta 64 jugadores y 10 torneos activos, soporte prioritario.',
        metadata: {
            plan: 'PREMIUM'
        }
    });
    console.log(`   ✅ Producto creado: ${premiumProduct.id}`);

    // Precio PREMIUM Mensual
    console.log('   💵 Creando precio mensual ($999 MXN/mes)...');
    const premiumMonthly = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 99900, // $999.00 MXN en centavos
        currency: 'mxn',
        recurring: {
            interval: 'month'
        },
        metadata: {
            plan: 'PREMIUM',
            interval: 'monthly'
        }
    });
    console.log(`   ✅ Precio mensual: ${premiumMonthly.id}`);

    // Precio PREMIUM Anual
    console.log('   💵 Creando precio anual ($9,990 MXN/año)...');
    const premiumYearly = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 999000, // $9,990.00 MXN en centavos
        currency: 'mxn',
        recurring: {
            interval: 'year'
        },
        metadata: {
            plan: 'PREMIUM',
            interval: 'yearly'
        }
    });
    console.log(`   ✅ Precio anual: ${premiumYearly.id}`);

    return {
        STRIPE_STANDARD_MONTHLY_PRICE_ID: standardMonthly.id,
        STRIPE_STANDARD_YEARLY_PRICE_ID: standardYearly.id,
        STRIPE_PREMIUM_MONTHLY_PRICE_ID: premiumMonthly.id,
        STRIPE_PREMIUM_YEARLY_PRICE_ID: premiumYearly.id
    };
}

async function updateEnvFile(priceIds: PriceIds) {
    console.log('\n📝 Actualizando archivo .env...');

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Actualizar cada Price ID
    for (const [key, value] of Object.entries(priceIds)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (envContent.match(regex)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            // Si no existe, agregar al final de la sección de Stripe
            envContent = envContent.replace(
                /(STRIPE_PREMIUM_YEARLY_PRICE_ID=).*$/m,
                `$1${key === 'STRIPE_PREMIUM_YEARLY_PRICE_ID' ? value : ''}`
            );
        }
    }

    // Reemplazar valores vacíos con los nuevos
    envContent = envContent.replace(/STRIPE_STANDARD_MONTHLY_PRICE_ID=\s*$/m, `STRIPE_STANDARD_MONTHLY_PRICE_ID=${priceIds.STRIPE_STANDARD_MONTHLY_PRICE_ID}`);
    envContent = envContent.replace(/STRIPE_STANDARD_YEARLY_PRICE_ID=\s*$/m, `STRIPE_STANDARD_YEARLY_PRICE_ID=${priceIds.STRIPE_STANDARD_YEARLY_PRICE_ID}`);
    envContent = envContent.replace(/STRIPE_PREMIUM_MONTHLY_PRICE_ID=\s*$/m, `STRIPE_PREMIUM_MONTHLY_PRICE_ID=${priceIds.STRIPE_PREMIUM_MONTHLY_PRICE_ID}`);
    envContent = envContent.replace(/STRIPE_PREMIUM_YEARLY_PRICE_ID=\s*$/m, `STRIPE_PREMIUM_YEARLY_PRICE_ID=${priceIds.STRIPE_PREMIUM_YEARLY_PRICE_ID}`);

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
        console.log(`  STANDARD Mensual: ${priceIds.STRIPE_STANDARD_MONTHLY_PRICE_ID}`);
        console.log(`  STANDARD Anual:   ${priceIds.STRIPE_STANDARD_YEARLY_PRICE_ID}`);
        console.log(`  PREMIUM Mensual: ${priceIds.STRIPE_PREMIUM_MONTHLY_PRICE_ID}`);
        console.log(`  PREMIUM Anual:   ${priceIds.STRIPE_PREMIUM_YEARLY_PRICE_ID}`);
        console.log('\n🎉 ¡Listo! Reinicia el servidor para aplicar los cambios.');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
