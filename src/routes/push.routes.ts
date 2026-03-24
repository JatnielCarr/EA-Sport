import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate } from '../middleware';

/**
 * =====================================================
 * RUTAS DE PUSH NOTIFICATIONS
 * =====================================================
 * Registro y eliminación de FCM tokens para que los
 * usuarios reciban push notifications reales.
 * =====================================================
 */

export async function pushRoutes(app: FastifyInstance) {

    /**
     * Registrar / actualizar FCM token del dispositivo
     */
    app.post('/push/register', {
        preHandler: [authenticate],
        schema: {
            tags: ['Push Notifications'],
            description: 'Registrar o actualizar el FCM token del dispositivo para recibir push notifications',
            body: {
                type: 'object',
                required: ['fcm_token'],
                properties: {
                    fcm_token: { type: 'string', minLength: 10 }
                }
            }
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;
        const { fcm_token } = request.body as { fcm_token: string };

        await prisma.user.update({
            where: { id: user.id },
            data: { fcm_token }
        });

        return { success: true, message: 'FCM token registrado correctamente. Recibirás notificaciones push.' };
    });

    /**
     * Eliminar FCM token (desactivar push)
     */
    app.delete('/push/unregister', {
        preHandler: [authenticate],
        schema: {
            tags: ['Push Notifications'],
            description: 'Eliminar el FCM token para dejar de recibir push notifications'
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;

        await prisma.user.update({
            where: { id: user.id },
            data: { fcm_token: null }
        });

        return { success: true, message: 'Push notifications desactivadas' };
    });

    /**
     * Ver estado de push notifications
     */
    app.get('/push/status', {
        preHandler: [authenticate],
        schema: {
            tags: ['Push Notifications'],
            description: 'Ver si el usuario tiene push notifications activas'
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;

        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { fcm_token: true }
        });

        return {
            success: true,
            data: {
                push_enabled: !!userData?.fcm_token,
                has_token: !!userData?.fcm_token
            }
        };
    });
}
