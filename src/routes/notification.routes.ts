import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate } from '../middleware';
import { notificationService } from '../services/notification.service';

/**
 * Notification Routes — In-App notification center
 */
export async function notificationRoutes(app: FastifyInstance) {

  // Get user notifications
  app.get('/notifications', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], description: 'Get user notifications' }
  }, async (request: any) => {
    const { limit = 30, offset = 0 } = request.query as any;
    const result = await notificationService.getUserNotifications(
      request.user.id, Number(limit), Number(offset)
    );
    return { success: true, data: result };
  });

  // Get unread count
  app.get('/notifications/unread-count', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], description: 'Get unread notification count' }
  }, async (request: any) => {
    const count = await notificationService.getUnreadCount(request.user.id);
    return { success: true, data: { count } };
  });

  // Mark one as read
  app.put('/notifications/:id/read', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], description: 'Mark notification as read' }
  }, async (request: any) => {
    const { id } = request.params;
    await notificationService.markAsRead(id, request.user.id);
    return { success: true };
  });

  // Mark all as read
  app.put('/notifications/read-all', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], description: 'Mark all as read' }
  }, async (request: any) => {
    await notificationService.markAllAsRead(request.user.id);
    return { success: true };
  });

  // Delete notification
  app.delete('/notifications/:id', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], description: 'Delete notification' }
  }, async (request: any) => {
    const { id } = request.params;
    await notificationService.delete(id, request.user.id);
    return { success: true };
  });
}
