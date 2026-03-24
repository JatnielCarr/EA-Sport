import { prisma } from '../config/database';
import { pushNotificationService } from './push-notification.service';

/**
 * =====================================================
 * SERVICIO DE NOTIFICACIONES — In-App + Push
 * =====================================================
 */

type NotificationType = 
  | 'MATCH_READY' | 'MATCH_RESULT' | 'TOURNAMENT_START' | 'TOURNAMENT_END'
  | 'PRIZE_RECEIVED' | 'WITHDRAWAL_STATUS' | 'TEAM_INVITE' | 'CLAN_INVITE'
  | 'DISPUTE_UPDATE' | 'CHECK_IN_REMINDER' | 'SYSTEM';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export const notificationService = {

  /**
   * Crear una notificación para un usuario + enviar push si tiene FCM token
   */
  async create(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        user_id: input.userId,
        type: input.type as any,
        title: input.title,
        message: input.message,
        data: input.data || undefined
      }
    });

    // Send push notification if user has FCM token
    try {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { fcm_token: true }
      });
      if (user?.fcm_token) {
        await pushNotificationService.sendToDevice(
          user.fcm_token,
          input.title,
          input.message,
          { type: input.type, notificationId: notification.id, ...(input.data ? { payload: JSON.stringify(input.data) } : {}) }
        );
      }
    } catch (pushErr) {
      console.warn('Push notification failed (non-blocking):', pushErr);
    }

    return notification;
  },

  /**
   * Crear notificaciones masivas (para todos los miembros de un equipo, clan, etc.)
   */
  async createBulk(userIds: string[], type: NotificationType, title: string, message: string, data?: any) {
    return prisma.notification.createMany({
      data: userIds.map(userId => ({
        user_id: userId,
        type: type as any,
        title,
        message,
        data: data || undefined
      }))
    });
  },

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(userId: string, limit = 30, offset = 0) {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notification.count({ where: { user_id: userId } }),
      prisma.notification.count({ where: { user_id: userId, read: false } })
    ]);

    return { notifications, total, unreadCount };
  },

  /**
   * Contar notificaciones no leídas
   */
  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { user_id: userId, read: false }
    });
  },

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { read: true, read_at: new Date() }
    });
  },

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true, read_at: new Date() }
    });
  },

  /**
   * Eliminar notificación
   */
  async delete(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, user_id: userId }
    });
  },

  /**
   * Limpiar notificaciones viejas (>30 días)
   */
  async cleanOld() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: { created_at: { lt: thirtyDaysAgo }, read: true }
    });

    console.log(`🧹 Cleaned ${result.count} old notifications`);
    return result;
  },

  // === HELPER METHODS FOR COMMON NOTIFICATIONS ===

  async notifyMatchReady(userIds: string[], matchData: { matchId: string; tournament: string; opponent: string }) {
    return this.createBulk(userIds, 'MATCH_READY',
      '⚔️ Partido Listo',
      `Tu partido en ${matchData.tournament} contra ${matchData.opponent} está listo. ¡Haz check-in!`,
      matchData
    );
  },

  async notifyPrizeReceived(userId: string, amount: number, tournament: string, position: number) {
    return this.create({
      userId,
      type: 'PRIZE_RECEIVED',
      title: `🏆 ¡Premio Recibido!`,
      message: `Ganaste $${amount.toFixed(2)} MXN por ${position}° lugar en ${tournament}. Ya está en tu monedero.`,
      data: { amount, tournament, position }
    });
  },

  async notifyWithdrawalStatus(userId: string, amount: number, status: string) {
    const approved = status === 'COMPLETED';
    return this.create({
      userId,
      type: 'WITHDRAWAL_STATUS',
      title: approved ? '✅ Retiro Aprobado' : '❌ Retiro Rechazado',
      message: `Tu retiro de $${amount.toFixed(2)} MXN fue ${approved ? 'aprobado y procesado' : 'rechazado'}.`,
      data: { amount, status }
    });
  },

  async notifyCheckInReminder(userIds: string[], matchId: string, minutesLeft: number) {
    return this.createBulk(userIds, 'CHECK_IN_REMINDER',
      `⏰ Check-in en ${minutesLeft} min`,
      `Tu partido comienza pronto. Haz check-in antes de que se cierre.`,
      { matchId, minutesLeft }
    );
  }
};
