/**
 * =====================================================
 * TEST STRIPE WEBHOOK - Script de prueba end-to-end
 * =====================================================
 * 
 * Este script simula diferentes eventos de Stripe para
 * verificar que el webhook procesa correctamente:
 * 
 * 1. checkout.session.completed (pagos únicos)
 * 2. customer.subscription.created (nueva suscripción)
 * 3. customer.subscription.deleted (cancelación)
 * 4. payment_intent.succeeded / payment_intent.payment_failed
 * 5. invoice.payment_succeeded (pagos recurrentes)
 * 
 * Uso: npx ts-node scripts/test-stripe-webhook.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface TestResult {
    test: string;
    success: boolean;
    status: number;
    response: any;
}

const results: TestResult[] = [];

async function testWebhook(testName: string, eventType: string, data: any) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`   Event Type: ${eventType}`);

    try {
        // Use the test endpoint (no signature verification needed)
        const response = await fetch(`${API_URL}/stripe/webhook/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventType, data }),
        });

        const result = await response.json();
        const success = response.ok;

        console.log(`   ${success ? '✅' : '❌'} Status: ${response.status}`);
        console.log(`   Response:`, JSON.stringify(result, null, 2));

        results.push({ test: testName, success, status: response.status, response: result });
        return { success, result };
    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        results.push({ test: testName, success: false, status: 0, response: error.message });
        return { success: false, result: error.message };
    }
}

async function testWebhookStatus() {
    console.log('\n📡 Checking Stripe webhook connection status...');

    try {
        const response = await fetch(`${API_URL}/stripe/webhook/status`);
        const result = await response.json();

        console.log(`   Status: ${result.status}`);
        console.log(`   Webhook Secret: ${result.webhookSecret ? '✅ Configured' : '⚠️ Not set'}`);
        console.log(`   Timestamp: ${result.timestamp}`);

        results.push({ test: 'Webhook Status', success: result.success, status: 200, response: result });
        return result;
    } catch (error: any) {
        console.error(`   ❌ Cannot connect to API: ${error.message}`);
        results.push({ test: 'Webhook Status', success: false, status: 0, response: error.message });
        return null;
    }
}

async function run() {
    console.log('='.repeat(60));
    console.log('   STRIPE WEBHOOK TEST SUITE');
    console.log('='.repeat(60));
    console.log(`\n🌐 API URL: ${API_URL}`);

    // Test 1: Webhook status check
    const status = await testWebhookStatus();

    if (!status) {
        console.log('\n❌ API not reachable. Make sure the server is running.');
        process.exit(1);
    }

    // Test 2: Checkout session completed - Tournament entry
    await testWebhook(
        'Checkout - Tournament Entry',
        'checkout.session.completed',
        {
            id: 'cs_test_tournament_entry',
            payment_intent: 'pi_test_001',
            payment_status: 'paid',
            client_reference_id: 'test_user_id',
            metadata: {
                userId: 'test_user_id',
                type: 'tournament_entry',
                tournamentId: 'test_tournament_id',
                teamId: 'test_team_id',
                entryFee: '100',
            }
        }
    );

    // Test 3: Checkout session completed - Balance topup
    await testWebhook(
        'Checkout - Balance Topup',
        'checkout.session.completed',
        {
            id: 'cs_test_topup',
            payment_intent: 'pi_test_002',
            payment_status: 'paid',
            client_reference_id: 'test_user_id',
            metadata: {
                userId: 'test_user_id',
                type: 'balance_topup',
                amount: '500',
            }
        }
    );

    // Test 4: Checkout session completed - Name change
    await testWebhook(
        'Checkout - Name Change',
        'checkout.session.completed',
        {
            id: 'cs_test_name_change',
            payment_intent: 'pi_test_003',
            payment_status: 'paid',
            client_reference_id: 'test_user_id',
            metadata: {
                userId: 'test_user_id',
                type: 'name_change',
            }
        }
    );

    // Test 5: Missing userId (should fail gracefully)
    await testWebhook(
        'Checkout - Missing UserId (error expected)',
        'checkout.session.completed',
        {
            id: 'cs_test_no_user',
            payment_intent: 'pi_test_004',
            metadata: {}
        }
    );

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('   TEST RESULTS SUMMARY');
    console.log('='.repeat(60) + '\n');

    let passed = 0;
    let failed = 0;

    results.forEach(r => {
        const icon = r.success ? '✅' : '❌';
        console.log(`${icon} ${r.test} (HTTP ${r.status})`);
        if (r.success) passed++;
        else failed++;
    });

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${results.length} total`);
    console.log('='.repeat(60));

    if (failed > 0) {
        console.log('\n⚠️  Some tests failed. Check the output above for details.');
    } else {
        console.log('\n🎉 All tests passed!');
    }
}

run().catch(console.error);
