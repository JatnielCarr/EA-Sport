import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { stripe } from '../config/stripe';
import { prisma } from '../config/database';
import Stripe from 'stripe';

// Augment FastifyInstance to include authenticate
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

export async function paymentRoutes(app: FastifyInstance) {
    // Get user balance
    app.get('/payment/balance', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Payment'],
            description: 'Get current user balance'
        }
    }, async (request: any, reply) => {
        const user = await prisma.user.findUnique({
            where: { id: request.user.id },
            select: { balance: true }
        });

        return { success: true, balance: user?.balance || 0 };
    });

    // Create Checkout Session
    app.post('/payment/create-checkout-session', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Payment'],
            description: 'Create a Stripe Checkout Session',
            body: {
                type: 'object',
                required: ['amount', 'currency'],
                properties: {
                    amount: { type: 'number', minimum: 10 },
                    currency: { type: 'string', default: 'mxn' },
                    description: { type: 'string' },
                    metadata: { type: 'object' }
                }
            }
        }
    }, async (request: any, reply) => {
        const { amount, currency, description, metadata } = request.body as { amount: number; currency: string; description?: string; metadata?: any };
        const user = request.user;

        // Check for existing Stripe Customer ID or create one
        let dbUser = await prisma.user.findUnique({ where: { id: user.id } });

        if (!dbUser) {
            return reply.status(404).send({ success: false, error: 'User not found' });
        }

        let customerId = dbUser.stripe_customer_id;

        if (!customerId) {
            try {
                const customer = await stripe.customers.create({
                    email: dbUser.email,
                    name: dbUser.username,
                    metadata: {
                        userId: dbUser.id
                    }
                });
                customerId = customer.id;

                await prisma.user.update({
                    where: { id: user.id },
                    data: { stripe_customer_id: customerId }
                });
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ success: false, error: 'Failed to create Stripe customer' });
            }
        }

        try {
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: currency || 'mxn',
                            product_data: {
                                name: description || 'Recarga de saldo',
                                description: `Añadir $${amount} ${currency?.toUpperCase() || 'MXN'} a tu cuenta`
                            },
                            unit_amount: Math.round(amount * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173'}/#/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.STRIPE_CANCEL_URL || 'http://localhost:5173'}/#/pago?canceled=true`,
                client_reference_id: user.id,
                metadata: {
                    userId: user.id,
                    type: 'add_funds',
                    amount: amount.toString(),
                    ...metadata
                }
            });

            // Record pending payment in DB
            await prisma.payment.create({
                data: {
                    user_id: user.id,
                    amount: amount,
                    currency: currency || 'mxn',
                    status: 'pending',
                    stripe_payment_id: session.id,
                    stripe_session_id: session.id,
                    metadata: metadata ? JSON.stringify(metadata) : undefined
                }
            });

            return reply.send({ success: true, url: session.url });

        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to create checkout session' });
        }
    });

    // Get payment history
    app.get('/payment/history', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Payment'],
            description: 'Get user payment history'
        }
    }, async (request: any, reply) => {
        const payments = await prisma.payment.findMany({
            where: { user_id: request.user.id },
            orderBy: { created_at: 'desc' },
            take: 20
        });

        return { success: true, data: payments };
    });

    // Create Name Change Checkout Session
    app.post('/payment/name-change-checkout', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Payment'],
            description: 'Create a Stripe Checkout Session for username change ($50 MXN)'
        }
    }, async (request: any, reply) => {
        const user = request.user;
        const NAME_CHANGE_PRICE = 50; // $50 MXN

        // Get user data
        let dbUser = await prisma.user.findUnique({ where: { id: user.id } });

        if (!dbUser) {
            return reply.status(404).send({ success: false, error: 'User not found' });
        }

        // Verify that user has already used their free name change
        if (dbUser.name_change_count === 0) {
            return reply.status(400).send({ 
                success: false, 
                error: 'Tu primer cambio de nombre es gratis. No necesitas pagar.' 
            });
        }

        let customerId = dbUser.stripe_customer_id;

        if (!customerId) {
            try {
                const customer = await stripe.customers.create({
                    email: dbUser.email,
                    name: dbUser.username,
                    metadata: { userId: dbUser.id }
                });
                customerId = customer.id;

                await prisma.user.update({
                    where: { id: user.id },
                    data: { stripe_customer_id: customerId }
                });
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ success: false, error: 'Failed to create Stripe customer' });
            }
        }

        try {
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'mxn',
                            product_data: {
                                name: 'Cambio de Nombre de Usuario',
                                description: 'Permite cambiar tu nombre de usuario en la plataforma'
                            },
                            unit_amount: NAME_CHANGE_PRICE * 100, // Stripe uses cents
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173'}/#/perfil?name_change=success&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.STRIPE_CANCEL_URL || 'http://localhost:5173'}/#/perfil?name_change=canceled`,
                client_reference_id: user.id,
                metadata: {
                    userId: user.id,
                    type: 'name_change',
                    amount: NAME_CHANGE_PRICE.toString()
                }
            });

            // Record pending payment in DB
            await prisma.payment.create({
                data: {
                    user_id: user.id,
                    amount: NAME_CHANGE_PRICE,
                    currency: 'mxn',
                    status: 'pending',
                    stripe_payment_id: session.id,
                    stripe_session_id: session.id,
                    metadata: JSON.stringify({ type: 'name_change' })
                }
            });

            return reply.send({ success: true, url: session.url });

        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to create checkout session' });
        }
    });

    // Verify name change payment and apply changes
    app.post('/payment/apply-name-change', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Payment'],
            description: 'Apply username change after successful payment',
            body: {
                type: 'object',
                required: ['session_id', 'new_username'],
                properties: {
                    session_id: { type: 'string' },
                    new_username: { type: 'string', minLength: 3, maxLength: 30 }
                }
            }
        }
    }, async (request: any, reply) => {
        const { session_id, new_username } = request.body as { session_id: string; new_username: string };
        const userId = request.user.id;

        try {
            // Verify the payment exists and is approved
            const payment = await prisma.payment.findFirst({
                where: {
                    user_id: userId,
                    stripe_session_id: session_id,
                    status: 'name_change_approved'
                }
            });

            if (!payment) {
                return reply.status(400).send({ 
                    success: false, 
                    error: 'No se encontró un pago válido para el cambio de nombre' 
                });
            }

            // Check username uniqueness
            const existing = await prisma.user.findUnique({
                where: { username: new_username }
            });
            if (existing && existing.id !== userId) {
                return reply.status(400).send({ success: false, error: 'El nombre de usuario ya está en uso' });
            }

            // Apply the name change
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    username: new_username,
                    name_change_count: { increment: 1 }
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    name_change_count: true
                }
            });

            // Mark payment as used
            await prisma.payment.update({
                where: { id: payment.id },
                data: { 
                    status: 'name_change_used',
                    metadata: JSON.stringify({
                        type: 'name_change',
                        new_username,
                        applied_at: new Date().toISOString()
                    })
                }
            });

            return { success: true, data: updatedUser };

        } catch (error) {
            console.error('Name change error:', error);
            return reply.status(500).send({ success: false, error: 'Failed to apply name change' });
        }
    });
}
