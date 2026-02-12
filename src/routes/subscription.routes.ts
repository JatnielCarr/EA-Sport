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
                maxUsers: null,
                features: [
                    'Participar en torneos gratuitos',
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
                maxUsers: null,
                features: [
                    'Todo lo del plan Gratis',
                    'Crear torneos privados',
                    'Estadísticas avanzadas',
                    'Soporte prioritario',
                    'Sin anuncios'
                ]
            },
            {
                id: 'PREMIUM',
                name: 'Premium',
                monthlyPrice: 999,
                yearlyPrice: 9990,
                currency: 'MXN',
                maxUsers: null,
                features: [
                    'Todo lo del plan Standard',
                    'Torneos ilimitados',
                    'Análisis profesional',
                    'API access',
                    'Soporte 24/7'
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
