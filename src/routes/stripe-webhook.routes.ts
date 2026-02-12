import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { stripe } from '../config/stripe';
import { prisma } from '../config/database';
import { revenueService } from '../services/revenue.service';

/**
 * =====================================================
 * WEBHOOK HANDLER CENTRALIZADO PARA STRIPE
 * =====================================================
 * Maneja todos los eventos de pago automáticamente:
 * - Pagos únicos (entradas, cambios de nombre, recargas)
 * - Suscripciones (crear, actualizar, cancelar)
 * - Verificación de firma de webhook
 */

export async function stripeWebhookRoutes(app: FastifyInstance) {

  // =====================================================
  // WEBHOOK PRINCIPAL - MANEJA TODOS LOS EVENTOS
  // =====================================================

  app.post('/stripe/webhook', {
    config: { rawBody: true }
  }, async (request: any, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    // =====================================================
    // VERIFICACIÓN DE FIRMA DE WEBHOOK
    // =====================================================
    if (endpointSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(
          request.rawBody,
          sig,
          endpointSecret
        );
        console.log('🔐 Webhook signature verified');
      } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
      }
    } else {
      // Para desarrollo sin verificación de firma
      event = request.body as Stripe.Event;
      console.log('⚠️ Webhook received without signature verification (development mode)');
    }

    console.log(`📥 Stripe webhook received: ${event.type} - ID: ${event.id}`);

    try {
      // =====================================================
      // PROCESAR EVENTO SEGÚN TIPO
      // =====================================================

      switch (event.type) {

        // =====================================================
        // CHECKOUT SESSION COMPLETED - PAGOS ÚNICOS
        // =====================================================
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`💳 Processing checkout session: ${session.id}`);

          const metadata = session.metadata || {};
          const userId = metadata.userId || session.client_reference_id;
          const paymentType = metadata.type;

          if (!userId) {
            console.error('❌ No userId found in checkout session metadata');
            return reply.status(400).send({ error: 'Missing user ID' });
          }

          // Actualizar estado del pago en la base de datos
          await prisma.payment.updateMany({
            where: { stripe_session_id: session.id },
            data: {
              status: 'succeeded',
              stripe_payment_id: session.payment_intent as string
            }
          });

          // =====================================================
          // PROCESAR SEGÚN TIPO DE PAGO
          // =====================================================

          switch (paymentType) {
            case 'tournament_entry': {
              // Entrada pagada a torneo
              const { tournamentId, teamId, entryFee } = metadata;
              if (tournamentId && teamId && entryFee) {
                await revenueService.recordTournamentEntryRevenue(
                  userId,
                  tournamentId,
                  teamId,
                  parseFloat(entryFee),
                  session.id
                );
                console.log(`✅ Tournament entry processed: ${tournamentId} - $${entryFee} MXN`);
              }
              break;
            }

            case 'name_change': {
              // Cambio de nombre
              await revenueService.recordNameChangeRevenue(userId, session.id);
              console.log(`✅ Name change processed for user: ${userId}`);
              break;
            }

            case 'balance_topup': {
              // Recarga de saldo
              const amount = metadata.amount;
              if (amount) {
                await revenueService.recordBalanceTopup(userId, parseFloat(amount), session.id);
                console.log(`✅ Balance topup processed: ${userId} - $${amount} MXN`);
              }
              break;
            }

            case 'subscription': {
              // Suscripción (manejar en eventos de suscripción)
              console.log(`📋 Subscription checkout completed: ${session.subscription}`);
              break;
            }

            default: {
              // Pago genérico
              const amount = metadata.amount;
              if (amount) {
                await prisma.platformRevenue.create({
                  data: {
                    transaction_type: 'BALANCE_TOPUP',
                    amount: parseFloat(amount),
                    currency: 'mxn',
                    status: 'COMPLETED',
                    user_id: userId,
                    stripe_payment_id: session.id,
                    description: metadata.description || 'Pago procesado'
                  }
                });
                console.log(`✅ Generic payment processed: ${userId} - $${amount} MXN`);
              }
            }
          }

          break;
        }

        // =====================================================
        // EVENTOS DE SUSCRIPCIÓN
        // =====================================================

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`📊 Processing subscription ${event.type}: ${subscription.id}`);

          // Encontrar usuario por customer ID
          const user = await prisma.user.findFirst({
            where: { stripe_customer_id: subscription.customer as string }
          });

          if (!user) {
            console.error(`❌ User not found for customer: ${subscription.customer}`);
            break;
          }

          // Determinar plan desde metadata o price ID
          let plan: 'FREE' | 'STANDARD' | 'PREMIUM' = 'FREE';

          if (subscription.metadata?.plan) {
            plan = subscription.metadata.plan as any;
          } else {
            // Fallback: determinar por price ID
            const priceId = subscription.items.data[0]?.price?.id;

            if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
                priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
              plan = 'STANDARD';
            } else if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
                      priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
              plan = 'PREMIUM';
            }
          }

          // Mapear status de Stripe
          let status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE' = 'ACTIVE';
          switch (subscription.status) {
            case 'canceled': status = 'CANCELED'; break;
            case 'past_due': status = 'PAST_DUE'; break;
            case 'trialing': status = 'TRIALING'; break;
            case 'incomplete': status = 'INCOMPLETE'; break;
          }

          // Actualizar suscripción en BD
          await prisma.subscription.upsert({
            where: { user_id: user.id },
            update: {
              plan,
              status,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price?.id,
              current_period_start: new Date((subscription as any).current_period_start * 1000),
              current_period_end: new Date((subscription as any).current_period_end * 1000),
              cancel_at_period_end: subscription.cancel_at_period_end
            },
            create: {
              user_id: user.id,
              plan,
              status,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price?.id,
              current_period_start: new Date((subscription as any).current_period_start * 1000),
              current_period_end: new Date((subscription as any).current_period_end * 1000)
            }
          });

          // Registrar revenue por suscripción (solo en creación/renovación)
          if (event.type === 'customer.subscription.created') {
            const amount = subscription.items.data[0]?.price?.unit_amount;
            if (amount) {
              await revenueService.recordSubscriptionRevenue(
                user.id,
                amount / 100, // Convertir de centavos
                plan,
                subscription.id
              );
              console.log(`💰 Subscription revenue recorded: ${user.id} - ${plan} - $${amount / 100} MXN`);
            }
          }

          console.log(`✅ Subscription updated: ${user.id} - ${plan} - ${status}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`🗑️ Processing subscription deletion: ${subscription.id}`);

          const user = await prisma.user.findFirst({
            where: { stripe_customer_id: subscription.customer as string }
          });

          if (user) {
            await prisma.subscription.update({
              where: { user_id: user.id },
              data: {
                plan: 'FREE',
                status: 'CANCELED',
                stripe_subscription_id: null,
                stripe_price_id: null
              }
            });
            console.log(`✅ Subscription canceled for user: ${user.id}`);
          }
          break;
        }

        // =====================================================
        // EVENTOS DE PAGO
        // =====================================================

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`💰 Payment succeeded: ${paymentIntent.id} - $${paymentIntent.amount / 100} MXN`);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`❌ Payment failed: ${paymentIntent.id}`);

          // Marcar pago como fallido
          await prisma.payment.updateMany({
            where: { stripe_payment_id: paymentIntent.id },
            data: { status: 'failed' }
          });
          break;
        }

        // =====================================================
        // EVENTOS DE FACTURACIÓN
        // =====================================================

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`📄 Invoice payment succeeded: ${invoice.id}`);

          // Para suscripciones recurrentes, registrar revenue
          if ((invoice as any).subscription) {
            const user = await prisma.user.findFirst({
              where: { stripe_customer_id: invoice.customer as string }
            });

            if (user && invoice.amount_paid > 0) {
              const subscription = await prisma.subscription.findUnique({
                where: { user_id: user.id }
              });

              if (subscription) {
                await revenueService.recordSubscriptionRevenue(
                  user.id,
                  invoice.amount_paid / 100,
                  subscription.plan,
                  invoice.id
                );
                console.log(`💰 Recurring subscription payment: ${user.id} - $${invoice.amount_paid / 100} MXN`);
              }
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`❌ Invoice payment failed: ${invoice.id}`);
          break;
        }

        // =====================================================
        // OTROS EVENTOS
        // =====================================================

        default: {
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }
      }

      return reply.send({ received: true });

    } catch (error: any) {
      console.error('❌ Webhook processing error:', error);
      return reply.status(500).send({ error: 'Webhook processing failed' });
    }
  });

  // =====================================================
  // ENDPOINT PARA PROBAR WEBHOOK (DESARROLLO)
  // =====================================================

  app.post('/stripe/webhook/test', async (request: any) => {
    const { eventType, data } = request.body;

    console.log(`🧪 Testing webhook event: ${eventType}`);

    // Simular evento de Stripe (no se usa actualmente)

    // Procesar como si fuera un webhook real
    try {
      switch (eventType) {
        case 'checkout.session.completed': {
          const session = data;
          const metadata = session.metadata || {};
          const userId = metadata.userId;

          if (metadata.type === 'tournament_entry') {
            await revenueService.recordTournamentEntryRevenue(
              userId,
              metadata.tournamentId,
              metadata.teamId,
              parseFloat(metadata.entryFee),
              'test_session_id'
            );
            console.log(`✅ Test: Tournament entry processed`);
          }
          break;
        }
      }

      return { success: true, message: 'Test webhook processed' };
    } catch (error: any) {
      throw new Error(error.message);
    }
  });

  // =====================================================
  // ENDPOINT PARA VERIFICAR CONEXIÓN
  // =====================================================

  app.get('/stripe/webhook/status', async () => {
    try {
      // Verificar que Stripe esté configurado
      await stripe.customers.list({ limit: 1 });

      return {
        success: true,
        status: 'connected',
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'disconnected',
        error: error.message
      };
    }
  });
}