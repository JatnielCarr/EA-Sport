import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from '../services/firebase/notification.service';
import { liveMatchService } from '../services/firebase/live-match.service';
import { clanChatService } from '../services/firebase/clan-chat.service';
import { userPresenceService } from '../services/firebase/user-presence.service';
import { activityFeedService } from '../services/firebase/activity-feed.service';

/**
 * =====================================================
 * RUTAS DE TIEMPO REAL (FIREBASE)
 * =====================================================
 * Estas rutas manejan datos en tiempo real que NO van a MySQL.
 * Separadas completamente de las rutas de Prisma.
 * =====================================================
 */

export async function liveUpdatesRoutes(fastify: FastifyInstance) {
  
  // =====================================================
  // NOTIFICACIONES
  // =====================================================
  
  /**
   * Obtener notificaciones de un usuario
   */
  fastify.get('/api/firebase/notifications/:userId', {
    schema: {
      tags: ['Firebase - Notificaciones'],
      description: 'Obtener notificaciones de un usuario',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const notifications = await notificationService.getUserNotifications(userId);
      return reply.send({ success: true, data: notifications });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Obtener notificaciones no leídas
   */
  fastify.get('/api/firebase/notifications/:userId/unread', {
    schema: {
      tags: ['Firebase - Notificaciones'],
      description: 'Obtener notificaciones no leídas'
    }
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const notifications = await notificationService.getUnreadNotifications(userId);
      return reply.send({ success: true, data: notifications, count: notifications.length });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Enviar notificación
   */
  fastify.post('/api/firebase/notifications', {
    schema: {
      tags: ['Firebase - Notificaciones'],
      description: 'Enviar notificación a un usuario',
      body: {
        type: 'object',
        required: ['userId', 'type', 'title', 'message'],
        properties: {
          userId: { type: 'string' },
          type: { type: 'string', enum: ['match_start', 'match_result', 'tournament_update', 'clan_invite', 'system'] },
          title: { type: 'string' },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { userId: string; type: any; title: string; message: string; data?: any } }>, reply: FastifyReply) => {
    try {
      const { userId, type, title, message, data } = request.body;
      const id = await notificationService.sendNotification(userId, type, title, message, data);
      return reply.send({ success: true, data: { id } });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Marcar notificación como leída
   */
  fastify.patch('/api/firebase/notifications/:notificationId/read', {
    schema: {
      tags: ['Firebase - Notificaciones'],
      description: 'Marcar notificación como leída'
    }
  }, async (request: FastifyRequest<{ Params: { notificationId: string } }>, reply: FastifyReply) => {
    try {
      const { notificationId } = request.params;
      await notificationService.markAsRead(notificationId);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Marcar todas las notificaciones como leídas
   */
  fastify.patch('/api/firebase/notifications/:userId/read-all', {
    schema: {
      tags: ['Firebase - Notificaciones'],
      description: 'Marcar todas las notificaciones como leídas'
    }
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      await notificationService.markAllAsRead(userId);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // =====================================================
  // PARTIDOS EN VIVO
  // =====================================================

  /**
   * Obtener todos los partidos en vivo
   */
  fastify.get('/api/firebase/live-matches', {
    schema: {
      tags: ['Firebase - Partidos en Vivo'],
      description: 'Obtener todos los partidos en vivo actualmente'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const matches = await liveMatchService.getAllLiveMatches();
      return reply.send({ success: true, data: matches });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Obtener partido en vivo específico
   */
  fastify.get('/api/firebase/live-matches/:matchId', {
    schema: {
      tags: ['Firebase - Partidos en Vivo'],
      description: 'Obtener estado de un partido en vivo'
    }
  }, async (request: FastifyRequest<{ Params: { matchId: string } }>, reply: FastifyReply) => {
    try {
      const { matchId } = request.params;
      const match = await liveMatchService.getLiveMatch(matchId);
      if (!match) {
        return reply.code(404).send({ success: false, error: 'Partido no encontrado' });
      }
      return reply.send({ success: true, data: match });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Obtener partidos en vivo de un torneo
   */
  fastify.get('/api/firebase/live-matches/tournament/:tournamentId', {
    schema: {
      tags: ['Firebase - Partidos en Vivo'],
      description: 'Obtener partidos en vivo de un torneo'
    }
  }, async (request: FastifyRequest<{ Params: { tournamentId: string } }>, reply: FastifyReply) => {
    try {
      const { tournamentId } = request.params;
      const matches = await liveMatchService.getTournamentLiveMatches(tournamentId);
      return reply.send({ success: true, data: matches });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Iniciar partido en vivo
   */
  fastify.post('/api/firebase/live-matches', {
    schema: {
      tags: ['Firebase - Partidos en Vivo'],
      description: 'Iniciar transmisión de partido en vivo',
      body: {
        type: 'object',
        required: ['matchId', 'tournamentId', 'homeTeam', 'awayTeam'],
        properties: {
          matchId: { type: 'string' },
          tournamentId: { type: 'string' },
          homeTeam: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          },
          awayTeam: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { matchId: string; tournamentId: string; homeTeam: { id: string; name: string }; awayTeam: { id: string; name: string } } }>, reply: FastifyReply) => {
    try {
      const { matchId, tournamentId, homeTeam, awayTeam } = request.body;
      await liveMatchService.startLiveMatch(matchId, tournamentId, homeTeam, awayTeam);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Actualizar score
   */
  fastify.patch('/api/firebase/live-matches/:matchId/score', {
    schema: {
      tags: ['Firebase - Partidos en Vivo'],
      description: 'Actualizar score del partido',
      body: {
        type: 'object',
        required: ['homeScore', 'awayScore'],
        properties: {
          homeScore: { type: 'number' },
          awayScore: { type: 'number' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { matchId: string }; Body: { homeScore: number; awayScore: number } }>, reply: FastifyReply) => {
    try {
      const { matchId } = request.params;
      const { homeScore, awayScore } = request.body;
      await liveMatchService.updateScore(matchId, homeScore, awayScore);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Cambiar estado del partido
   */
  fastify.patch('/api/firebase/live-matches/:matchId/status', {
    schema: {
      tags: ['Firebase - Partidos en Vivo'],
      description: 'Cambiar estado del partido (live, paused, finished)',
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['live', 'paused', 'finished'] },
          homeScore: { type: 'number' },
          awayScore: { type: 'number' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { matchId: string }; Body: { status: string; homeScore?: number; awayScore?: number } }>, reply: FastifyReply) => {
    try {
      const { matchId } = request.params;
      const { status, homeScore, awayScore } = request.body;
      
      if (status === 'live') {
        await liveMatchService.setMatchLive(matchId);
      } else if (status === 'paused') {
        await liveMatchService.pauseMatch(matchId);
      } else if (status === 'finished' && homeScore !== undefined && awayScore !== undefined) {
        await liveMatchService.finishMatch(matchId, homeScore, awayScore);
      }
      
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // =====================================================
  // CHAT DE CLANES
  // =====================================================

  /**
   * Obtener mensajes del chat de un clan
   */
  fastify.get('/api/firebase/clan-chat/:clanId', {
    schema: {
      tags: ['Firebase - Chat de Clanes'],
      description: 'Obtener mensajes del chat de un clan'
    }
  }, async (request: FastifyRequest<{ Params: { clanId: string }; Querystring: { limit?: number } }>, reply: FastifyReply) => {
    try {
      const { clanId } = request.params;
      const limit = request.query.limit || 100;
      const messages = await clanChatService.getMessages(clanId, limit);
      return reply.send({ success: true, data: messages });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Enviar mensaje al chat del clan
   */
  fastify.post('/api/firebase/clan-chat/:clanId', {
    schema: {
      tags: ['Firebase - Chat de Clanes'],
      description: 'Enviar mensaje al chat del clan',
      body: {
        type: 'object',
        required: ['userId', 'username', 'content'],
        properties: {
          userId: { type: 'string' },
          username: { type: 'string' },
          content: { type: 'string' },
          type: { type: 'string', enum: ['message', 'announcement'], default: 'message' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { clanId: string }; Body: { userId: string; username: string; content: string; type?: 'message' | 'announcement' } }>, reply: FastifyReply) => {
    try {
      const { clanId } = request.params;
      const { userId, username, content, type } = request.body;
      const id = await clanChatService.sendMessage(clanId, userId, username, content, type || 'message');
      return reply.send({ success: true, data: { id } });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // =====================================================
  // PRESENCIA DE USUARIOS
  // =====================================================

  /**
   * Obtener usuarios online
   */
  fastify.get('/api/firebase/presence/online', {
    schema: {
      tags: ['Firebase - Presencia'],
      description: 'Obtener usuarios online'
    }
  }, async (request: FastifyRequest<{ Querystring: { limit?: number } }>, reply: FastifyReply) => {
    try {
      const limit = request.query.limit || 100;
      const users = await userPresenceService.getOnlineUsers(limit);
      return reply.send({ success: true, data: users, count: users.length });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Obtener estado de un usuario
   */
  fastify.get('/api/firebase/presence/:userId', {
    schema: {
      tags: ['Firebase - Presencia'],
      description: 'Obtener estado de presencia de un usuario'
    }
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const presence = await userPresenceService.getPresence(userId);
      return reply.send({ success: true, data: presence });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Marcar usuario como online
   */
  fastify.post('/api/firebase/presence/:userId/online', {
    schema: {
      tags: ['Firebase - Presencia'],
      description: 'Marcar usuario como online',
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' },
          activity: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string }; Body: { username: string; activity?: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const { username, activity } = request.body;
      await userPresenceService.setOnline(userId, username, activity);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Marcar usuario como offline
   */
  fastify.post('/api/firebase/presence/:userId/offline', {
    schema: {
      tags: ['Firebase - Presencia'],
      description: 'Marcar usuario como offline'
    }
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      await userPresenceService.setOffline(userId);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  /**
   * Heartbeat (mantener sesión activa)
   */
  fastify.post('/api/firebase/presence/:userId/heartbeat', {
    schema: {
      tags: ['Firebase - Presencia'],
      description: 'Actualizar último visto del usuario'
    }
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      await userPresenceService.heartbeat(userId);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // =====================================================
  // FEED DE ACTIVIDAD
  // =====================================================

  /**
   * Obtener feed de actividad reciente
   */
  fastify.get('/api/firebase/activity-feed', {
    schema: {
      tags: ['Firebase - Feed de Actividad'],
      description: 'Obtener actividad reciente de la plataforma'
    }
  }, async (request: FastifyRequest<{ Querystring: { limit?: number; type?: string } }>, reply: FastifyReply) => {
    try {
      const { limit, type } = request.query;
      let activities;
      
      if (type) {
        activities = await activityFeedService.getActivityByType(type as any, limit || 20);
      } else {
        activities = await activityFeedService.getRecentActivity(limit || 50);
      }
      
      return reply.send({ success: true, data: activities });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // =====================================================
  // HEALTH CHECK FIREBASE
  // =====================================================

  /**
   * Verificar conexión a Firebase
   */
  fastify.get('/api/firebase/health', {
    schema: {
      tags: ['Firebase - Sistema'],
      description: 'Verificar estado de conexión a Firebase'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Intento simple de lectura para verificar conexión
      const testDoc = await activityFeedService.getRecentActivity(1);
      return reply.send({
        success: true,
        firebase: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        firebase: 'disconnected',
        error: error.message
      });
    }
  });
}