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
    apiVersion: '2024-09-30.acacia'
});

interface PriceIds {
    STRIPE_PRO_MONTHLY_PRICE_ID: string;
    STRIPE_PRO_YEARLY_PRICE_ID: string;
    STRIPE_PREMIUM_MONTHLY_PRICE_ID: string;
    STRIPE_PREMIUM_YEARLY_PRICE_ID: string;
}

async function createProducts(): Promise<PriceIds> {
    console.log('🚀 Creando productos en Stripe...\n');

    // Crear producto PRO
    console.log('📦 Creando producto PRO...');
    const proProduct = await stripe.products.create({
        name: 'ApexTournament Pro',
        description: 'Acceso a torneos premium, estadísticas avanzadas, badge exclusivo y más.',
        metadata: {
            plan: 'PRO'
        }
    });
    console.log(`   ✅ Producto creado: ${proProduct.id}`);

    // Precio PRO Mensual
    console.log('   💵 Creando precio mensual ($99 MXN/mes)...');
    const proMonthly = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 9900, // $99.00 MXN en centavos
        currency: 'mxn',
        recurring: {
            interval: 'month'
        },
        metadata: {
            plan: 'PRO',
            interval: 'monthly'
        }
    });
    console.log(`   ✅ Precio mensual: ${proMonthly.id}`);

    // Precio PRO Anual
    console.log('   💵 Creando precio anual ($990 MXN/año)...');
    const proYearly = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 99000, // $990.00 MXN en centavos
        currency: 'mxn',
        recurring: {
            interval: 'year'
        },
        metadata: {
            plan: 'PRO',
            interval: 'yearly'
        }
    });
    console.log(`   ✅ Precio anual: ${proYearly.id}`);

    // Crear producto PREMIUM
    console.log('\n📦 Creando producto PREMIUM...');
    const premiumProduct = await stripe.products.create({
        name: 'ApexTournament Premium',
        description: 'Todo lo de Pro más torneos exclusivos, coaching personalizado, badge legendario y acceso anticipado.',
        metadata: {
            plan: 'PREMIUM'
        }
    });
    console.log(`   ✅ Producto creado: ${premiumProduct.id}`);

    // Precio PREMIUM Mensual
    console.log('   💵 Creando precio mensual ($199 MXN/mes)...');
    const premiumMonthly = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 19900, // $199.00 MXN en centavos
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
    console.log('   💵 Creando precio anual ($1990 MXN/año)...');
    const premiumYearly = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 199000, // $1990.00 MXN en centavos
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
        STRIPE_PRO_MONTHLY_PRICE_ID: proMonthly.id,
        STRIPE_PRO_YEARLY_PRICE_ID: proYearly.id,
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
    envContent = envContent.replace(/STRIPE_PRO_MONTHLY_PRICE_ID=\s*$/m, `STRIPE_PRO_MONTHLY_PRICE_ID=${priceIds.STRIPE_PRO_MONTHLY_PRICE_ID}`);
    envContent = envContent.replace(/STRIPE_PRO_YEARLY_PRICE_ID=\s*$/m, `STRIPE_PRO_YEARLY_PRICE_ID=${priceIds.STRIPE_PRO_YEARLY_PRICE_ID}`);
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
        console.log(`  PRO Mensual:     ${priceIds.STRIPE_PRO_MONTHLY_PRICE_ID}`);
        console.log(`  PRO Anual:       ${priceIds.STRIPE_PRO_YEARLY_PRICE_ID}`);
        console.log(`  PREMIUM Mensual: ${priceIds.STRIPE_PREMIUM_MONTHLY_PRICE_ID}`);
        console.log(`  PREMIUM Anual:   ${priceIds.STRIPE_PREMIUM_YEARLY_PRICE_ID}`);
        console.log('\n🎉 ¡Listo! Reinicia el servidor para aplicar los cambios.');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
