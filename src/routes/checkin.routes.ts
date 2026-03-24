import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate, requireRole } from '../middleware';
import { notificationService } from '../services/notification.service';

/**
 * Match Check-In Routes
 */
export async function checkInRoutes(app: FastifyInstance) {

  // Player check-in for a match
  app.post('/matches/:matchId/check-in', {
    preHandler: [authenticate],
    schema: {
      tags: ['Matches'],
      description: 'Check in for a match',
      params: { type: 'object', properties: { matchId: { type: 'string' } } }
    }
  }, async (request: any, reply) => {
    const { matchId } = request.params;
    const userId = request.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        home_team: { include: { players: true } },
        away_team: { include: { players: true } },
        checkins: true,
        tournament: true
      }
    });

    if (!match) return reply.status(404).send({ success: false, error: 'Partido no encontrado' });

    // Verify match is in CHECK_IN or SCHEDULED status
    if (match.status !== 'CHECK_IN' && match.status !== 'SCHEDULED') {
      return reply.status(400).send({ success: false, error: 'Este partido no está en fase de check-in' });
    }

    // Find which team the user belongs to
    const isOnHome = match.home_team?.players.some(p => p.user_id === userId);
    const isOnAway = match.away_team?.players.some(p => p.user_id === userId);

    if (!isOnHome && !isOnAway) {
      return reply.status(403).send({ success: false, error: 'No eres parte de ningún equipo en este partido' });
    }

    const teamId = isOnHome ? match.home_team_id! : match.away_team_id!;

    // Check if already checked in
    const existing = match.checkins.find(c => c.user_id === userId);
    if (existing) {
      return reply.status(400).send({ success: false, error: 'Ya hiciste check-in' });
    }

    // Create check-in
    const checkin = await prisma.matchCheckIn.create({
      data: { match_id: matchId, user_id: userId, team_id: teamId }
    });

    // If match is SCHEDULED, transition to CHECK_IN
    if (match.status === 'SCHEDULED') {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'CHECK_IN' }
      });
    }

    // Check if both teams have at least one check-in → transition to LIVE
    const allCheckins = [...match.checkins, checkin];
    const homeCheckedIn = allCheckins.some(c => c.team_id === match.home_team_id);
    const awayCheckedIn = allCheckins.some(c => c.team_id === match.away_team_id);

    if (homeCheckedIn && awayCheckedIn) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'LIVE' }
      });
    }

    return {
      success: true,
      data: checkin,
      message: 'Check-in exitoso. ¡Buena suerte!',
      match_status: homeCheckedIn && awayCheckedIn ? 'LIVE' : 'CHECK_IN'
    };
  });

  // Get check-in status for a match
  app.get('/matches/:matchId/check-in', {
    preHandler: [authenticate],
    schema: { tags: ['Matches'], description: 'Get check-in status for a match' }
  }, async (request: any) => {
    const { matchId } = request.params as any;

    const checkins = await prisma.matchCheckIn.findMany({
      where: { match_id: matchId },
      include: { user: { select: { id: true, username: true, avatar_url: true } } }
    });

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { home_team_id: true, away_team_id: true, status: true }
    });

    return {
      success: true,
      data: {
        checkins,
        homeTeamCheckins: checkins.filter(c => c.team_id === match?.home_team_id),
        awayTeamCheckins: checkins.filter(c => c.team_id === match?.away_team_id),
        matchStatus: match?.status
      }
    };
  });

  // Admin: Open check-in for a match
  app.post('/matches/:matchId/open-checkin', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: { tags: ['Matches'], description: 'Open check-in for a match (admin)' }
  }, async (request: any, reply) => {
    const { matchId } = request.params as any;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        home_team: { include: { players: true } },
        away_team: { include: { players: true } },
        tournament: true
      }
    });

    if (!match) return reply.status(404).send({ success: false, error: 'Partido no encontrado' });

    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'CHECK_IN' }
    });

    // Notify players
    const playerIds = [
      ...(match.home_team?.players.map(p => p.user_id) || []),
      ...(match.away_team?.players.map(p => p.user_id) || [])
    ];

    if (playerIds.length > 0) {
      await notificationService.notifyCheckInReminder(playerIds, matchId, 15);
    }

    return { success: true, message: 'Check-in abierto. Jugadores notificados.' };
  });
}
