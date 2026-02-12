import { prisma } from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * =====================================================
 * SERVICIO DE REVENUE - Monetización de la Plataforma
 * =====================================================
 * 
 * Revenue Streams:
 * 1. Suscripciones (Standard $499/mes, Premium $999/mes)
 * 2. Entry fees de torneos (5-10% comisión)
 * 3. Comisión sobre prize pools (5%)
 * 4. Cambios de nombre ($50)
 * 5. Recargas de saldo (eventual marketplace)
 */

// Configuración de comisiones
export const PLATFORM_FEES = {
  // Comisión sobre entry fees de torneos
  TOURNAMENT_ENTRY_FEE_PERCENT: 10, // 10%
  
  // Comisión sobre prize pools
  PRIZE_POOL_COMMISSION_PERCENT: 5, // 5%
  
  // Precio de cambio de nombre
  NAME_CHANGE_PRICE: 50, // $50 MXN
  
  // Precios de suscripción
  SUBSCRIPTION_PRICES: {
    STANDARD: {
      monthly: 499,
      yearly: 4990,
    },
    PREMIUM: {
      monthly: 999,
      yearly: 9990,
    }
  }
} as const;

export class RevenueService {
  
  // =====================================================
  // REGISTRO DE TRANSACCIONES
  // =====================================================
  
  /**
   * Registrar ingreso por suscripción
   */
  async recordSubscriptionRevenue(
    userId: string,
    amount: number,
    plan: string,
    stripePaymentId?: string
  ) {
    return prisma.platformRevenue.create({
      data: {
        transaction_type: 'SUBSCRIPTION',
        amount: new Decimal(amount),
        status: 'COMPLETED',
        user_id: userId,
        stripe_payment_id: stripePaymentId,
        description: `Suscripción ${plan}`,
        metadata: { plan }
      }
    });
  }
  
  /**
   * Registrar ingreso por entrada a torneo
   */
  async recordTournamentEntryRevenue(
    userId: string,
    tournamentId: string,
    teamId: string,
    entryFee: number,
    stripePaymentId?: string
  ) {
    const platformFee = entryFee * (PLATFORM_FEES.TOURNAMENT_ENTRY_FEE_PERCENT / 100);
    const netAmount = entryFee - platformFee;
    
    // Crear registro de entrada
    const entry = await prisma.tournamentEntry.create({
      data: {
        tournament_id: tournamentId,
        team_id: teamId,
        user_id: userId,
        entry_fee: new Decimal(entryFee),
        platform_fee: new Decimal(platformFee),
        net_amount: new Decimal(netAmount),
        status: 'COMPLETED',
        stripe_payment_id: stripePaymentId,
        paid_at: new Date()
      }
    });
    
    // Registrar revenue de plataforma
    await prisma.platformRevenue.create({
      data: {
        transaction_type: 'TOURNAMENT_ENTRY',
        amount: new Decimal(platformFee),
        status: 'COMPLETED',
        user_id: userId,
        tournament_id: tournamentId,
        stripe_payment_id: stripePaymentId,
        description: `Comisión entrada torneo`,
        metadata: { teamId, entryFee, platformFeePercent: PLATFORM_FEES.TOURNAMENT_ENTRY_FEE_PERCENT }
      }
    });
    
    return entry;
  }
  
  /**
   * Registrar comisión sobre premio
   */
  async recordPrizeCommission(
    tournamentId: string,
    teamId: string,
    position: number,
    grossAmount: number
  ) {
    const platformFee = grossAmount * (PLATFORM_FEES.PRIZE_POOL_COMMISSION_PERCENT / 100);
    const netAmount = grossAmount - platformFee;
    
    // Crear registro de distribución de premio
    const distribution = await prisma.prizeDistribution.create({
      data: {
        tournament_id: tournamentId,
        team_id: teamId,
        position,
        gross_amount: new Decimal(grossAmount),
        platform_fee: new Decimal(platformFee),
        net_amount: new Decimal(netAmount)
      }
    });
    
    // Registrar revenue de plataforma
    await prisma.platformRevenue.create({
      data: {
        transaction_type: 'PRIZE_COMMISSION',
        amount: new Decimal(platformFee),
        status: 'COMPLETED',
        tournament_id: tournamentId,
        description: `Comisión premio ${position}° lugar`,
        metadata: { teamId, position, grossAmount, platformFeePercent: PLATFORM_FEES.PRIZE_POOL_COMMISSION_PERCENT }
      }
    });
    
    return distribution;
  }
  
  /**
   * Registrar ingreso por cambio de nombre
   */
  async recordNameChangeRevenue(userId: string, stripePaymentId?: string) {
    return prisma.platformRevenue.create({
      data: {
        transaction_type: 'NAME_CHANGE',
        amount: new Decimal(PLATFORM_FEES.NAME_CHANGE_PRICE),
        status: 'COMPLETED',
        user_id: userId,
        stripe_payment_id: stripePaymentId,
        description: 'Cambio de nombre de usuario'
      }
    });
  }
  
  /**
   * Registrar ingreso por recarga de saldo
   */
  async recordBalanceTopup(userId: string, amount: number, stripePaymentId?: string) {
    return prisma.platformRevenue.create({
      data: {
        transaction_type: 'BALANCE_TOPUP',
        amount: new Decimal(amount),
        status: 'COMPLETED',
        user_id: userId,
        stripe_payment_id: stripePaymentId,
        description: 'Recarga de saldo'
      }
    });
  }
  
  // =====================================================
  // MÉTRICAS Y REPORTES
  // =====================================================
  
  /**
   * Obtener resumen de revenue
   */
  async getRevenueSummary(startDate?: Date, endDate?: Date) {
    const where: any = { status: 'COMPLETED' };
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = startDate;
      if (endDate) where.created_at.lte = endDate;
    }
    
    const revenues = await prisma.platformRevenue.groupBy({
      by: ['transaction_type'],
      where,
      _sum: { amount: true },
      _count: true
    });
    
    const totalRevenue = await prisma.platformRevenue.aggregate({
      where,
      _sum: { amount: true },
      _count: true
    });
    
    return {
      byType: revenues.map(r => ({
        type: r.transaction_type,
        total: r._sum.amount,
        count: r._count
      })),
      total: totalRevenue._sum.amount || 0,
      transactionCount: totalRevenue._count
    };
  }
  
  /**
   * Calcular MRR (Monthly Recurring Revenue)
   */
  async calculateMRR() {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        plan: { not: 'FREE' }
      }
    });
    
    let mrr = 0;
    
    for (const sub of activeSubscriptions) {
      const prices = PLATFORM_FEES.SUBSCRIPTION_PRICES[sub.plan as keyof typeof PLATFORM_FEES.SUBSCRIPTION_PRICES];
      if (prices) {
        // Si es anual, dividir entre 12 para MRR
        const isYearly = sub.stripe_price_id?.includes('yearly');
        mrr += isYearly ? prices.yearly / 12 : prices.monthly;
      }
    }
    
    return {
      mrr,
      arr: mrr * 12,
      activeSubscribers: activeSubscriptions.length,
      breakdown: {
        standard: activeSubscriptions.filter(s => s.plan === 'STANDARD').length,
        premium: activeSubscriptions.filter(s => s.plan === 'PREMIUM').length
      }
    };
  }
  
  /**
   * Obtener revenue de hoy
   */
  async getTodayRevenue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.getRevenueSummary(today);
  }
  
  /**
   * Obtener revenue del mes actual
   */
  async getMonthRevenue() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return this.getRevenueSummary(startOfMonth);
  }
  
  /**
   * Obtener historial de transacciones
   */
  async getTransactionHistory(limit = 50, offset = 0, type?: string) {
    const where: any = {};
    if (type) where.transaction_type = type;
    
    const [transactions, total] = await Promise.all([
      prisma.platformRevenue.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.platformRevenue.count({ where })
    ]);
    
    return { transactions, total, limit, offset };
  }
  
  /**
   * Obtener revenue por torneo
   */
  async getTournamentRevenue(tournamentId: string) {
    const [entries, prizes] = await Promise.all([
      prisma.tournamentEntry.aggregate({
        where: { tournament_id: tournamentId, status: 'COMPLETED' },
        _sum: { platform_fee: true, entry_fee: true }
      }),
      prisma.prizeDistribution.aggregate({
        where: { tournament_id: tournamentId },
        _sum: { platform_fee: true, gross_amount: true }
      })
    ]);
    
    return {
      tournamentId,
      entryFees: {
        total: entries._sum.entry_fee || 0,
        platformRevenue: entries._sum.platform_fee || 0
      },
      prizes: {
        total: prizes._sum.gross_amount || 0,
        platformRevenue: prizes._sum.platform_fee || 0
      },
      totalPlatformRevenue: 
        (Number(entries._sum.platform_fee) || 0) + 
        (Number(prizes._sum.platform_fee) || 0)
    };
  }
  
  /**
   * Generar métricas diarias
   */
  async generateDailyMetrics(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const revenue = await this.getRevenueSummary(startOfDay, endOfDay);
    const mrrData = await this.calculateMRR();
    
    // Calcular por tipo
    const byType = revenue.byType.reduce((acc, r) => {
      acc[r.type] = Number(r.total) || 0;
      return acc;
    }, {} as Record<string, number>);
    
    return prisma.revenueMetrics.upsert({
      where: {
        period_type_period_start: {
          period_type: 'daily',
          period_start: startOfDay
        }
      },
      update: {
        total_revenue: new Decimal(Number(revenue.total) || 0),
        subscription_revenue: new Decimal(byType.SUBSCRIPTION || 0),
        tournament_revenue: new Decimal((byType.TOURNAMENT_ENTRY || 0) + (byType.PRIZE_COMMISSION || 0)),
        commission_revenue: new Decimal(byType.PRIZE_COMMISSION || 0),
        other_revenue: new Decimal((byType.NAME_CHANGE || 0) + (byType.BALANCE_TOPUP || 0)),
        total_transactions: revenue.transactionCount,
        mrr: new Decimal(mrrData.mrr),
        arr: new Decimal(mrrData.arr)
      },
      create: {
        period_type: 'daily',
        period_start: startOfDay,
        period_end: endOfDay,
        total_revenue: new Decimal(Number(revenue.total) || 0),
        subscription_revenue: new Decimal(byType.SUBSCRIPTION || 0),
        tournament_revenue: new Decimal((byType.TOURNAMENT_ENTRY || 0) + (byType.PRIZE_COMMISSION || 0)),
        commission_revenue: new Decimal(byType.PRIZE_COMMISSION || 0),
        other_revenue: new Decimal((byType.NAME_CHANGE || 0) + (byType.BALANCE_TOPUP || 0)),
        total_transactions: revenue.transactionCount,
        new_subscribers: 0,
        churned_subscribers: 0,
        mrr: new Decimal(mrrData.mrr),
        arr: new Decimal(mrrData.arr)
      }
    });
  }
  
  /**
   * Obtener dashboard completo de revenue
   */
  async getRevenueDashboard() {
    const [today, month, mrr, recentTransactions] = await Promise.all([
      this.getTodayRevenue(),
      this.getMonthRevenue(),
      this.calculateMRR(),
      this.getTransactionHistory(10)
    ]);
    
    return {
      today: {
        revenue: today.total,
        transactions: today.transactionCount
      },
      month: {
        revenue: month.total,
        transactions: month.transactionCount,
        byType: month.byType
      },
      recurring: {
        mrr: mrr.mrr,
        arr: mrr.arr,
        subscribers: mrr.activeSubscribers,
        breakdown: mrr.breakdown
      },
      recentTransactions: recentTransactions.transactions
    };
  }
}

// Exportar instancia singleton
export const revenueService = new RevenueService();
