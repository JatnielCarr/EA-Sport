import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { stripe } from '../config/stripe';
import { prisma } from '../config/database';

// Augment FastifyInstance to include authenticate
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

// Price IDs from Stripe Dashboard - You'll need to create these in Stripe
const PRICE_IDS = {
    STANDARD_MONTHLY: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID || process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_standard_monthly',
    STANDARD_YEARLY: process.env.STRIPE_STANDARD_YEARLY_PRICE_ID || process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_standard_yearly',
    PREMIUM_MONTHLY: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    PREMIUM_YEARLY: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
};

export async function subscriptionRoutes(app: FastifyInstance) {

    // Get subscription plans/pricing info
    app.get('/subscriptions/plans', {
        schema: {
            tags: ['Subscriptions'],
            description: 'Get available subscription plans'
        }
    }, async (request, reply) => {
        const plans = [
            {
                id: 'FREE',
                name: 'Gratis',
                price: 0,
                currency: 'MXN',
                interval: 'forever',
                maxParticipants: 0,
                maxTournaments: 0,
                features: [
                    'Participar en torneos por invitación',
                    'Ver partidas en vivo',
                    'Perfil básico',
                    'Crear/Unirse a Clan'
                ]
            },
            {
                id: 'STANDARD',
                name: 'Standard',
                monthlyPrice: 499,
                yearlyPrice: 4990,
                currency: 'MXN',
                maxParticipants: 16,
                maxTournaments: 3,
                features: [
                    'Todo lo del plan Gratis',
                    'Crear y administrar torneos',
                    'Hasta 16 jugadores por torneo',
                    'Hasta 3 torneos activos',
                    'Generación de URL de invitación',
                    'Cobro de cuota de inscripción',
                    'Estadísticas avanzadas',
                    'Sin anuncios'
                ]
            },
            {
                id: 'PREMIUM',
                name: 'Premium',
                monthlyPrice: 999,
                yearlyPrice: 9990,
                currency: 'MXN',
                maxParticipants: 64,
                maxTournaments: 10,
                features: [
                    'Todo lo del plan Standard',
                    'Hasta 64 jugadores por torneo',
                    'Hasta 10 torneos activos',
                    'Análisis profesional',
                    'Soporte prioritario 24/7',
                    'API access'
                ]
            }
        ];

        return { success: true, data: plans };
    });

    // Get current user's subscription
    app.get('/subscriptions/current', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Subscriptions'],
            description: 'Get current user subscription status'
        }
    }, async (request: any, reply) => {
        const userId = request.user.id;

        const subscription = await prisma.subscription.findUnique({
            where: { user_id: userId }
        });

        if (!subscription) {
            return {
                success: true,
                data: {
                    plan: 'FREE',
                    status: 'ACTIVE',
                    current_period_start: null,
                    current_period_end: null
                }
            };
        }

        return { success: true, data: subscription };
    });

    // Alias: /subscriptions/me -> same as /subscriptions/current (frontend compatibility)
    app.get('/subscriptions/me', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Subscriptions'],
            description: 'Get current user subscription status (alias for /current)'
        }
    }, async (request: any, reply) => {
        const userId = request.user.id;

        const subscription = await prisma.subscription.findUnique({
            where: { user_id: userId }
        });

        if (!subscription) {
            return {
                success: true,
                data: {
                    plan: 'FREE',
                    status: 'ACTIVE',
                    current_period_start: null,
                    current_period_end: null
                }
            };
        }

        return { success: true, data: subscription };
    });

    // Verify checkout session and activate subscription (replaces webhook for local dev)
    app.get('/subscriptions/verify-session/:sessionId', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Subscriptions'],
            description: 'Verify Stripe checkout session and activate subscription'
        }
    }, async (request: any, reply) => {
        const { sessionId } = request.params as { sessionId: string };
        const userId = request.user.id;

        try {
            // Retrieve the checkout session from Stripe
            const session = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['subscription']
            });

            if (!session) {
                return reply.status(404).send({ success: false, error: 'Session not found' });
            }

            // Verify this session belongs to this user
            const metadata = session.metadata || {};
            if (metadata.userId !== userId && session.client_reference_id !== userId) {
                return reply.status(403).send({ success: false, error: 'Session does not belong to this user' });
            }

            // Check payment status
            if (session.payment_status !== 'paid') {
                return { success: false, error: 'Payment not completed', status: session.payment_status };
            }

            // Determine plan from metadata
            const plan = metadata.plan || 'STANDARD';
            const interval = metadata.interval || 'monthly';

            // Get subscription details from Stripe
            const stripeSubscription = session.subscription as any;

            if (stripeSubscription) {
                // Map Stripe status
                let status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE' = 'ACTIVE';
                switch (stripeSubscription.status) {
                    case 'canceled': status = 'CANCELED'; break;
                    case 'past_due': status = 'PAST_DUE'; break;
                    case 'trialing': status = 'TRIALING'; break;
                    case 'incomplete': status = 'INCOMPLETE'; break;
                }

                // Upsert subscription in DB
                const subscription = await prisma.subscription.upsert({
                    where: { user_id: userId },
                    update: {
                        plan: plan as any,
                        status,
                        stripe_subscription_id: stripeSubscription.id,
                        stripe_price_id: stripeSubscription.items?.data?.[0]?.price?.id,
                        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
                        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
                        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false
                    },
                    create: {
                        user_id: userId,
                        plan: plan as any,
                        status,
                        stripe_subscription_id: stripeSubscription.id,
                        stripe_price_id: stripeSubscription.items?.data?.[0]?.price?.id,
                        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
                        current_period_end: new Date(stripeSubscription.current_period_end * 1000)
                    }
                });

                console.log(`✅ Subscription verified and activated: ${userId} - ${plan} - ${status}`);
                return { success: true, data: subscription };
            } else {
                return reply.status(400).send({ success: false, error: 'No subscription found in session' });
            }

        } catch (error: any) {
            console.error('Subscription verification error:', error);
            return reply.status(500).send({ success: false, error: 'Failed to verify session' });
        }
    });

    // Create checkout session for subscription
    app.post('/subscriptions/create-checkout-session', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Subscriptions'],
            description: 'Create Stripe checkout session for subscription',
            body: {
                type: 'object',
                required: ['plan', 'interval'],
                properties: {
                    plan: { type: 'string', enum: ['STANDARD', 'PREMIUM'] },
                    interval: { type: 'string', enum: ['monthly', 'yearly'] }
                }
            }
        }
    }, async (request: any, reply) => {
        const { plan, interval } = request.body as { plan: 'STANDARD' | 'PREMIUM'; interval: 'monthly' | 'yearly' };
        const userId = request.user.id;

        try {
            // Get or create Stripe customer
            let customer;
            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (user?.stripe_customer_id) {
                customer = await stripe.customers.retrieve(user.stripe_customer_id);
            } else {
                customer = await stripe.customers.create({
                    email: user?.email,
                    name: user?.username,
                    metadata: { userId: userId }
                });

                // Save customer ID
                await prisma.user.update({
                    where: { id: userId },
                    data: { stripe_customer_id: customer.id }
                });
            }

            // Get price ID
            const priceKey = `${plan}_${interval.toUpperCase()}` as keyof typeof PRICE_IDS;
            const priceId = PRICE_IDS[priceKey];

            if (!priceId) {
                return reply.status(400).send({ success: false, error: 'Invalid plan or interval' });
            }

            // Create checkout session
            const session = await stripe.checkout.sessions.create({
                customer: customer.id,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173'}/#/perfil?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.STRIPE_CANCEL_URL || 'http://localhost:5173'}/#/perfil?subscription=canceled`,
                metadata: {
                    userId: userId,
                    plan: plan,
                    interval: interval
                }
            });

            return { success: true, url: session.url };

        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to create checkout session' });
        }
    });

    // Cancel subscription
    app.post('/subscriptions/cancel', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Subscriptions'],
            description: 'Cancel current subscription'
        }
    }, async (request: any, reply) => {
        const userId = request.user.id;

        const subscription = await prisma.subscription.findUnique({
            where: { user_id: userId }
        });

        if (!subscription || !subscription.stripe_subscription_id) {
            return reply.status(400).send({ success: false, error: 'No active subscription found' });
        }

        try {
            // Cancel at period end (user keeps access until end of billing period)
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                cancel_at_period_end: true
            });

            await prisma.subscription.update({
                where: { user_id: userId },
                data: { cancel_at_period_end: true }
            });

            return { success: true, message: 'Subscription will be canceled at end of billing period' };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to cancel subscription' });
        }
    });
}
