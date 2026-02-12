import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { revenueService, PLATFORM_FEES } from '../services/revenue.service';
import { stripe } from '../config/stripe';
import { prisma } from '../config/database';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * =====================================================
 * RUTAS DE MONETIZACIÓN Y REVENUE
 * =====================================================
 * 
 * Endpoints para:
 * - Pago de entrada a torneos
 * - Dashboard de revenue (admin)
 * - Métricas y reportes
 * - Distribución de premios
 */

export async function monetizationRoutes(app: FastifyInstance) {
  
  // =====================================================
  // CONFIGURACIÓN DE FEES (Público)
  // =====================================================
  
  /**
   * Obtener configuración de fees de la plataforma
   */
  app.get('/monetization/fees', async (request, reply) => {
    return {
      success: true,
      data: {
        tournamentEntryFee: `${PLATFORM_FEES.TOURNAMENT_ENTRY_FEE_PERCENT}%`,
        prizePoolCommission: `${PLATFORM_FEES.PRIZE_POOL_COMMISSION_PERCENT}%`,
        nameChangePrice: PLATFORM_FEES.NAME_CHANGE_PRICE,
        subscriptionPrices: PLATFORM_FEES.SUBSCRIPTION_PRICES
      }
    };
  });
  
  // =====================================================
  // ENTRADA PAGADA A TORNEOS
  // =====================================================
  
  /**
   * Crear sesión de pago para entrada a torneo
   */
  app.post('/monetization/tournament-entry/checkout', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Monetization'],
      description: 'Crear sesión de pago para entrada a torneo',
      body: {
        type: 'object',
        required: ['tournamentId', 'teamId'],
        properties: {
          tournamentId: { type: 'string' },
          teamId: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    const { tournamentId, teamId } = request.body;
    const userId = request.user.id;
    
    // Obtener torneo
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });
    
    if (!tournament) {
      return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
    }
    
    if (Number(tournament.entry_fee) === 0) {
      return reply.status(400).send({ success: false, error: 'Este torneo es gratuito' });
    }
    
    // Verificar si ya pagó
    const existingEntry = await prisma.tournamentEntry.findUnique({
      where: { tournament_id_team_id: { tournament_id: tournamentId, team_id: teamId } }
    });
    
    if (existingEntry?.status === 'COMPLETED') {
      return reply.status(400).send({ success: false, error: 'Ya has pagado la entrada para este torneo' });
    }
    
    // Obtener usuario
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });
    }
    
    // Obtener o crear Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripe_customer_id: customerId }
      });
    }
    
    const entryFee = Number(tournament.entry_fee);
    const platformFee = entryFee * (PLATFORM_FEES.TOURNAMENT_ENTRY_FEE_PERCENT / 100);
    
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mxn',
              product_data: {
                name: `Entrada: ${tournament.name}`,
                description: `Inscripción de equipo al torneo. Incluye ${PLATFORM_FEES.TOURNAMENT_ENTRY_FEE_PERCENT}% de comisión de plataforma.`
              },
              unit_amount: Math.round(entryFee * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173'}/#/tournament/${tournament.slug}?entry=success`,
        cancel_url: `${process.env.STRIPE_CANCEL_URL || 'http://localhost:5173'}/#/tournament/${tournament.slug}?entry=canceled`,
        metadata: {
          type: 'tournament_entry',
          userId,
          tournamentId,
          teamId,
          entryFee: entryFee.toString(),
          platformFee: platformFee.toString()
        }
      });
      
      // Crear entrada pendiente
      await prisma.tournamentEntry.upsert({
        where: { tournament_id_team_id: { tournament_id: tournamentId, team_id: teamId } },
        create: {
          tournament_id: tournamentId,
          team_id: teamId,
          user_id: userId,
          entry_fee: entryFee,
          platform_fee: platformFee,
          net_amount: entryFee - platformFee,
          status: 'PENDING',
          stripe_payment_id: session.id
        },
        update: {
          stripe_payment_id: session.id,
          status: 'PENDING'
        }
      });
      
      return reply.send({ success: true, url: session.url });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Error creando sesión de pago' });
    }
  });
  
  /**
   * Verificar estado de entrada a torneo
   */
  app.get('/monetization/tournament-entry/:tournamentId/:teamId', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Monetization'],
      description: 'Verificar estado de entrada a torneo'
    }
  }, async (request: any, reply) => {
    const { tournamentId, teamId } = request.params;
    
    const entry = await prisma.tournamentEntry.findUnique({
      where: { tournament_id_team_id: { tournament_id: tournamentId, team_id: teamId } }
    });
    
    return {
      success: true,
      data: entry ? {
        status: entry.status,
        paidAt: entry.paid_at,
        entryFee: entry.entry_fee
      } : null
    };
  });
  
  // =====================================================
  // DASHBOARD DE REVENUE (Solo Admin)
  // =====================================================
  
  /**
   * Obtener dashboard completo de revenue
   */
  app.get('/monetization/dashboard', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Monetization - Admin'],
      description: 'Obtener dashboard de revenue (solo admin)'
    }
  }, async (request: any, reply) => {
    // Verificar si es admin
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo administradores pueden ver el dashboard' });
    }
    
    try {
      const dashboard = await revenueService.getRevenueDashboard();
      return { success: true, data: dashboard };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Error obteniendo dashboard' });
    }
  });
  
  /**
   * Obtener MRR y métricas de suscripción
   */
  app.get('/monetization/mrr', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Monetization - Admin'],
      description: 'Obtener MRR y métricas de suscripción (solo admin)'
    }
  }, async (request: any, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo administradores' });
    }
    
    try {
      const mrr = await revenueService.calculateMRR();
      return { success: true, data: mrr };
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
  
  /**
   * Obtener historial de transacciones
   */
  app.get('/monetization/transactions', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Monetization - Admin'],
      description: 'Obtener historial de transacciones (solo admin)',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 },
          type: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo administradores' });
    }
    
    const { limit, offset, type } = request.query;
    
    try {
      const result = await revenueService.getTransactionHistory(limit, offset, type);
      return { success: true, data: result };
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
  
  /**
   * Obtener revenue de un torneo específico
   */
  app.get('/monetization/tournament/:tournamentId/revenue', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Monetization - Admin'],
      description: 'Obtener revenue de un torneo específico'
    }
  }, async (request: any, reply) => {
    if (request.user.role !== 'ADMIN' && request.user.role !== 'ORGANIZER') {
      return reply.status(403).send({ success: false, error: 'Solo administradores u organizadores' });
    }
    
    const { tournamentId } = request.params;
    
    try {
      const revenue = await revenueService.getTournamentRevenue(tournamentId);
      return { success: true, data: revenue };
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
  
  /**
   * Obtener resumen de revenue por periodo
   */
  app.get('/monetization/summary', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Monetization - Admin'],
      description: 'Obtener resumen de revenue por periodo',
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month', 'year'], default: 'month' }
        }
      }
    }
  }, async (request: any, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo administradores' });
    }
    
    const { period } = request.query;
    
    const startDate = new Date();
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    try {
      const summary = await revenueService.getRevenueSummary(startDate);
      return { success: true, data: summary, period };
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
  
  // =====================================================
  // DISTRIBUCIÓN DE PREMIOS
  // =====================================================
  
  /**
   * Calcular y registrar distribución de premios
   */
  app.post('/monetization/tournament/:tournamentId/distribute-prizes', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Monetization - Admin'],
      description: 'Calcular y registrar distribución de premios',
      body: {
        type: 'object',
        required: ['distributions'],
        properties: {
          distributions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['teamId', 'position', 'amount'],
              properties: {
                teamId: { type: 'string' },
                position: { type: 'number' },
                amount: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    if (request.user.role !== 'ADMIN' && request.user.role !== 'ORGANIZER') {
      return reply.status(403).send({ success: false, error: 'Solo administradores u organizadores' });
    }
    
    const { tournamentId } = request.params;
    const { distributions } = request.body;
    
    try {
      const results = [];
      
      for (const dist of distributions) {
        const result = await revenueService.recordPrizeCommission(
          tournamentId,
          dist.teamId,
          dist.position,
          dist.amount
        );
        results.push(result);
      }
      
      return {
        success: true,
        data: {
          distributions: results,
          totalPrizes: distributions.reduce((sum: number, d: any) => sum + d.amount, 0),
          platformFees: results.reduce((sum, r) => sum + Number(r.platform_fee), 0)
        }
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
  
  // =====================================================
  // WEBHOOK PARA MONETIZACIÓN
  // =====================================================
  
  /**
   * Webhook para procesar pagos de monetización
   */
  app.post('/monetization/webhook', {
    config: { rawBody: true }
  }, async (request: any, reply) => {
    const event = request.body;
    
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;
        
        if (metadata?.type === 'tournament_entry') {
          // Procesar pago de entrada a torneo
          await revenueService.recordTournamentEntryRevenue(
            metadata.userId,
            metadata.tournamentId,
            metadata.teamId,
            parseFloat(metadata.entryFee),
            session.id
          );
          
          console.log(`✅ Entrada a torneo registrada: ${metadata.tournamentId}`);
        }
      }
      
      return reply.send({ received: true });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  });
}
