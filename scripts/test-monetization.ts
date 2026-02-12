import { prisma } from '../src/config/database';
import { revenueService, PLATFORM_FEES } from '../src/services/revenue.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Script para crear datos de prueba de monetización
 * Ejecutar con: npx tsx scripts/test-monetization.ts
 */

async function testMonetization() {
  console.log('💰 Iniciando pruebas de monetización...\n');

  try {
    // 1. Simular ingresos por suscripciones
    console.log('📊 Simulando ingresos por suscripciones...');
    
    await revenueService.recordSubscriptionRevenue(
      'user-demo-1',
      PLATFORM_FEES.SUBSCRIPTION_PRICES.STANDARD.monthly,
      'STANDARD',
      'stripe_sub_demo_1'
    );
    console.log(`✅ Suscripción STANDARD registrada: $${PLATFORM_FEES.SUBSCRIPTION_PRICES.STANDARD.monthly} MXN`);
    
    await revenueService.recordSubscriptionRevenue(
      'user-demo-2',
      PLATFORM_FEES.SUBSCRIPTION_PRICES.PREMIUM.monthly,
      'PREMIUM',
      'stripe_sub_demo_2'
    );
    console.log(`✅ Suscripción PREMIUM registrada: $${PLATFORM_FEES.SUBSCRIPTION_PRICES.PREMIUM.monthly} MXN`);
    
    // 2. Simular entrada pagada a torneo
    console.log('\n🎮 Simulando entradas pagadas a torneos...');
    
    const entryFee = 500; // $500 MXN
    const platformFee = entryFee * (PLATFORM_FEES.TOURNAMENT_ENTRY_FEE_PERCENT / 100);
    
    await prisma.tournamentEntry.create({
      data: {
        tournament_id: 'tournament-demo-1',
        team_id: 'team-demo-1',
        user_id: 'user-demo-3',
        entry_fee: new Decimal(entryFee),
        platform_fee: new Decimal(platformFee),
        net_amount: new Decimal(entryFee - platformFee),
        status: 'COMPLETED',
        stripe_payment_id: 'stripe_entry_demo_1',
        paid_at: new Date()
      }
    });
    
    await prisma.platformRevenue.create({
      data: {
        transaction_type: 'TOURNAMENT_ENTRY',
        amount: new Decimal(platformFee),
        status: 'COMPLETED',
        user_id: 'user-demo-3',
        tournament_id: 'tournament-demo-1',
        stripe_payment_id: 'stripe_entry_demo_1',
        description: 'Comisión entrada torneo demo'
      }
    });
    console.log(`✅ Entrada a torneo: $${entryFee} MXN (Comisión: $${platformFee} MXN)`);
    
    // Más entradas
    for (let i = 2; i <= 5; i++) {
      await prisma.tournamentEntry.create({
        data: {
          tournament_id: 'tournament-demo-1',
          team_id: `team-demo-${i}`,
          user_id: `user-demo-${i + 2}`,
          entry_fee: new Decimal(entryFee),
          platform_fee: new Decimal(platformFee),
          net_amount: new Decimal(entryFee - platformFee),
          status: 'COMPLETED',
          stripe_payment_id: `stripe_entry_demo_${i}`,
          paid_at: new Date()
        }
      });
      
      await prisma.platformRevenue.create({
        data: {
          transaction_type: 'TOURNAMENT_ENTRY',
          amount: new Decimal(platformFee),
          status: 'COMPLETED',
          user_id: `user-demo-${i + 2}`,
          tournament_id: 'tournament-demo-1',
          stripe_payment_id: `stripe_entry_demo_${i}`,
          description: 'Comisión entrada torneo demo'
        }
      });
    }
    console.log(`✅ ${4} entradas adicionales registradas`);
    
    // 3. Simular distribución de premios
    console.log('\n🏆 Simulando distribución de premios...');
    
    const prizeDistributions = [
      { teamId: 'team-demo-1', position: 1, grossAmount: 5000 },
      { teamId: 'team-demo-2', position: 2, grossAmount: 2500 },
      { teamId: 'team-demo-3', position: 3, grossAmount: 1000 },
    ];
    
    for (const dist of prizeDistributions) {
      await revenueService.recordPrizeCommission(
        'tournament-demo-1',
        dist.teamId,
        dist.position,
        dist.grossAmount
      );
      const commission = dist.grossAmount * (PLATFORM_FEES.PRIZE_POOL_COMMISSION_PERCENT / 100);
      console.log(`✅ Premio ${dist.position}° lugar: $${dist.grossAmount} MXN (Comisión: $${commission} MXN)`);
    }
    
    // 4. Simular cambios de nombre
    console.log('\n✏️ Simulando cambios de nombre...');
    
    await revenueService.recordNameChangeRevenue('user-demo-4', 'stripe_name_demo_1');
    await revenueService.recordNameChangeRevenue('user-demo-5', 'stripe_name_demo_2');
    console.log(`✅ 2 cambios de nombre registrados: $${PLATFORM_FEES.NAME_CHANGE_PRICE * 2} MXN`);
    
    // 5. Simular recargas de saldo
    console.log('\n💳 Simulando recargas de saldo...');
    
    await revenueService.recordBalanceTopup('user-demo-6', 200, 'stripe_topup_demo_1');
    await revenueService.recordBalanceTopup('user-demo-7', 500, 'stripe_topup_demo_2');
    console.log(`✅ 2 recargas de saldo: $700 MXN`);
    
    // 6. Obtener dashboard de revenue
    console.log('\n📈 Obteniendo dashboard de revenue...');
    
    const dashboard = await revenueService.getRevenueDashboard();
    
    console.log('\n' + '='.repeat(60));
    console.log('💰 DASHBOARD DE REVENUE');
    console.log('='.repeat(60));
    console.log(`\n📅 HOY:`);
    console.log(`   Revenue: $${dashboard.today.revenue} MXN`);
    console.log(`   Transacciones: ${dashboard.today.transactions}`);
    
    console.log(`\n📅 ESTE MES:`);
    console.log(`   Revenue: $${dashboard.month.revenue} MXN`);
    console.log(`   Transacciones: ${dashboard.month.transactions}`);
    console.log(`   Por tipo:`);
    dashboard.month.byType.forEach(t => {
      console.log(`     - ${t.type}: $${t.total} MXN (${t.count} txns)`);
    });
    
    console.log(`\n📊 MÉTRICAS RECURRENTES:`);
    console.log(`   MRR: $${dashboard.recurring.mrr} MXN`);
    console.log(`   ARR: $${dashboard.recurring.arr} MXN`);
    console.log(`   Suscriptores activos: ${dashboard.recurring.subscribers}`);
    
    console.log(`\n🔄 ÚLTIMAS TRANSACCIONES:`);
    dashboard.recentTransactions.slice(0, 5).forEach(t => {
      console.log(`   - ${t.transaction_type}: $${t.amount} MXN (${t.created_at.toISOString().split('T')[0]})`);
    });
    
    // 7. Revenue por torneo
    console.log('\n🎮 REVENUE POR TORNEO (tournament-demo-1):');
    const tournamentRevenue = await revenueService.getTournamentRevenue('tournament-demo-1');
    console.log(`   Entry Fees Total: $${tournamentRevenue.entryFees.total} MXN`);
    console.log(`   Entry Fees Comisión: $${tournamentRevenue.entryFees.platformRevenue} MXN`);
    console.log(`   Premios Total: $${tournamentRevenue.prizes.total} MXN`);
    console.log(`   Premios Comisión: $${tournamentRevenue.prizes.platformRevenue} MXN`);
    console.log(`   TOTAL PLATAFORMA: $${tournamentRevenue.totalPlatformRevenue} MXN`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡Pruebas de monetización completadas!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error en pruebas de monetización:', error);
    process.exit(1);
  }
}

// Ejecutar
testMonetization().then(() => {
  console.log('\n✨ Script completado.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
