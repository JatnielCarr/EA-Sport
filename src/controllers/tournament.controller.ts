import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate } from '../middleware';

// Subscription limits for tournament creation
const SUBSCRIPTION_TOURNAMENT_LIMITS: Record<string, { maxParticipants: number; maxTournaments: number }> = {
  STANDARD: { maxParticipants: 16, maxTournaments: 3 },
  PREMIUM: { maxParticipants: 64, maxTournaments: 10 },
};

// Helper: generate unique invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function tournamentController(app: FastifyInstance) {
  // Tournaments
  app.get('/tournaments', {
    schema: {
      tags: ['Tournaments'],
      description: 'Get all tournaments',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' }
          }
        }
      }
    }
  }, async () => {
    const tournaments = await prisma.tournament.findMany();
    return { success: true, data: tournaments };
  });
  app.post('/tournaments', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Create a new tournament (requires STANDARD or PREMIUM subscription)',
      body: {
        type: 'object',
        required: ['name', 'slug', 'game_id', 'format', 'team_size', 'start_date'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          game_id: { type: 'string' },
          format: { type: 'string' },
          team_size: { type: 'integer' },
          max_participants: { type: 'integer' },
          region: { type: 'string' },
          entry_fee: { type: 'number' },
          start_date: { type: 'string', format: 'date-time' },
          registration_deadline: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    const userId = request.user.id;
    const data = request.body as any;

    // ADMIN ONLY: Only administrators can create tournaments
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({
        success: false,
        error: 'Solo los administradores pueden crear torneos.'
      });
    }

    // Verify user has active subscription (STANDARD or PREMIUM)
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId }
    });

    if (!subscription || subscription.plan === 'FREE' || subscription.status !== 'ACTIVE') {
      return reply.status(403).send({
        success: false,
        error: 'Necesitas una suscripción STANDARD o PREMIUM activa para crear torneos. Los ingresos por suscripción mantienen la plataforma.'
      });
    }

    const limits = SUBSCRIPTION_TOURNAMENT_LIMITS[subscription.plan];
    if (!limits) {
      return reply.status(403).send({
        success: false,
        error: 'Tu plan de suscripción no permite crear torneos.'
      });
    }

    // Check tournament count limit
    const currentTournamentCount = await prisma.tournament.count({
      where: {
        organizer_id: userId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      }
    });

    if (currentTournamentCount >= limits.maxTournaments) {
      return reply.status(403).send({
        success: false,
        error: `Tu plan ${subscription.plan} permite máximo ${limits.maxTournaments} torneos activos. Tienes ${currentTournamentCount}.`
      });
    }

    // Enforce max participants based on subscription
    const requestedMax = data.max_participants || 16;
    if (requestedMax > limits.maxParticipants) {
      return reply.status(400).send({
        success: false,
        error: `Tu plan ${subscription.plan} permite máximo ${limits.maxParticipants} participantes por torneo.`
      });
    }

    // Set organizer_id from authenticated user
    data.organizer_id = userId;
    data.max_participants = requestedMax;

    if (!data.region) {
      data.region = 'LATAM';
    }
    if (!data.registration_deadline) {
      const startDate = new Date(data.start_date);
      startDate.setDate(startDate.getDate() - 1);
      data.registration_deadline = startDate.toISOString();
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = await prisma.tournament.findUnique({ where: { invite_code: inviteCode } });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await prisma.tournament.findUnique({ where: { invite_code: inviteCode } });
    }
    data.invite_code = inviteCode;
    data.invite_active = true;

    // If entry_fee > 0, mark as requiring entry fee
    if (data.entry_fee && Number(data.entry_fee) > 0) {
      data.requires_entry_fee = true;
    }

    const tournament = await prisma.tournament.create({ data });

    // Build invite URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const inviteUrl = `${baseUrl}/#/tournament/invite/${inviteCode}`;

    return {
      success: true,
      data: {
        ...tournament,
        invite_url: inviteUrl,
        subscription_plan: subscription.plan,
        max_allowed_participants: limits.maxParticipants
      }
    };
  });

  // =====================================================
  // INVITE URL SYSTEM
  // =====================================================

  // Get tournament by invite code (public - no auth required)
  app.get('/tournaments/invite/:inviteCode', {
    schema: {
      tags: ['Tournaments'],
      description: 'Get tournament details by invite code (for registration)'
    }
  }, async (request, reply) => {
    const { inviteCode } = request.params as { inviteCode: string };

    const tournament = await prisma.tournament.findUnique({
      where: { invite_code: inviteCode },
      include: {
        game: true,
        organizer: {
          select: { id: true, username: true, avatar_url: true }
        },
        teams: {
          include: { players: true }
        }
      }
    });

    if (!tournament) {
      return reply.status(404).send({ success: false, error: 'Código de invitación inválido' });
    }

    if (!tournament.invite_active) {
      return reply.status(403).send({ success: false, error: 'La invitación a este torneo ya no está activa' });
    }

    if (tournament.status !== 'REGISTRATION_OPEN' && tournament.status !== 'DRAFT' && tournament.status !== 'PUBLISHED') {
      return reply.status(403).send({ success: false, error: 'El torneo no está aceptando registros' });
    }

    // Count current participants
    const currentTeams = tournament.teams.length;
    const spotsLeft = tournament.max_participants - currentTeams;

    return {
      success: true,
      data: {
        ...tournament,
        current_teams: currentTeams,
        spots_left: spotsLeft,
        requires_payment: tournament.requires_entry_fee && Number(tournament.entry_fee) > 0
      }
    };
  });

  // Regenerate invite code (tournament admin only)
  app.post('/tournaments/:id/regenerate-invite', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Regenerate invite code for a tournament'
    }
  }, async (request: any, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
    }
    if (tournament.organizer_id !== userId && request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo el organizador puede regenerar el código' });
    }

    let inviteCode = generateInviteCode();
    let codeExists = await prisma.tournament.findUnique({ where: { invite_code: inviteCode } });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await prisma.tournament.findUnique({ where: { invite_code: inviteCode } });
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: { invite_code: inviteCode, invite_active: true }
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    return {
      success: true,
      data: {
        invite_code: inviteCode,
        invite_url: `${baseUrl}/#/tournament/invite/${inviteCode}`
      }
    };
  });

  // Toggle invite active/inactive
  app.patch('/tournaments/:id/invite-status', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Enable or disable tournament invite link'
    }
  }, async (request: any, reply) => {
    const { id } = request.params as { id: string };
    const { active } = request.body as { active: boolean };
    const userId = request.user.id;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
    }
    if (tournament.organizer_id !== userId && request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo el organizador puede cambiar el estado de la invitación' });
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: { invite_active: active }
    });

    return { success: true, data: { invite_active: updated.invite_active } };
  });

  // =====================================================
  // STREAMING MANAGEMENT
  // =====================================================

  // Update tournament streaming URLs
  app.patch('/tournaments/:id/streaming', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Update tournament streaming URLs (Twitch/YouTube)',
      body: {
        type: 'object',
        properties: {
          twitch_url: { type: 'string' },
          youtube_url: { type: 'string' },
          stream_active: { type: 'boolean' }
        }
      }
    }
  }, async (request: any, reply) => {
    const { id } = request.params as { id: string };
    const { twitch_url, youtube_url, stream_active } = request.body as {
      twitch_url?: string;
      youtube_url?: string;
      stream_active?: boolean;
    };
    const userId = request.user.id;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
    }
    if (tournament.organizer_id !== userId && request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo el organizador puede gestionar las transmisiones' });
    }

    // Validate URLs if provided
    if (twitch_url && !twitch_url.match(/^(https?:\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9_]+$/)) {
      return reply.status(400).send({ success: false, error: 'URL de Twitch inválida' });
    }
    if (youtube_url && !youtube_url.match(/^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|user\/|@|c\/)?[a-zA-Z0-9_-]+|youtu\.be\/[a-zA-Z0-9_-]+)$/)) {
      return reply.status(400).send({ success: false, error: 'URL de YouTube inválida' });
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        twitch_url: twitch_url || null,
        youtube_url: youtube_url || null,
        stream_active: stream_active ?? tournament.stream_active
      }
    });

    return {
      success: true,
      data: {
        twitch_url: updated.twitch_url,
        youtube_url: updated.youtube_url,
        stream_active: updated.stream_active
      }
    };
  });

  // Update match streaming URLs
  app.patch('/matches/:id/streaming', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Matches'],
      description: 'Update match streaming URLs (Twitch/YouTube)',
      body: {
        type: 'object',
        properties: {
          twitch_url: { type: 'string' },
          youtube_url: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    const { id } = request.params as { id: string };
    const { twitch_url, youtube_url } = request.body as {
      twitch_url?: string;
      youtube_url?: string;
    };
    const userId = request.user.id;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { tournament: true }
    });
    if (!match) {
      return reply.status(404).send({ success: false, error: 'Partido no encontrado' });
    }
    if (match.tournament.organizer_id !== userId && request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo el organizador del torneo puede gestionar las transmisiones' });
    }

    // Validate URLs if provided
    if (twitch_url && !twitch_url.match(/^(https?:\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9_]+$/)) {
      return reply.status(400).send({ success: false, error: 'URL de Twitch inválida' });
    }
    if (youtube_url && !youtube_url.match(/^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|user\/|@|c\/)?[a-zA-Z0-9_-]+|youtu\.be\/[a-zA-Z0-9_-]+)$/)) {
      return reply.status(400).send({ success: false, error: 'URL de YouTube inválida' });
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        twitch_url: twitch_url || null,
        youtube_url: youtube_url || null
      }
    });

    return {
      success: true,
      data: {
        twitch_url: updated.twitch_url,
        youtube_url: updated.youtube_url
      }
    };
  });

  // Register team via invite (requires auth + optional payment)
  app.post('/tournaments/invite/:inviteCode/register', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Register to a tournament via invite code',
      body: {
        type: 'object',
        required: ['team_name', 'team_tag'],
        properties: {
          team_name: { type: 'string' },
          team_tag: { type: 'string' },
          logo_url: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    const { inviteCode } = request.params as { inviteCode: string };
    const { team_name, team_tag, logo_url } = request.body;
    const userId = request.user.id;

    // Find tournament by invite code
    const tournament = await prisma.tournament.findUnique({
      where: { invite_code: inviteCode },
      include: { teams: true }
    });

    if (!tournament) {
      return reply.status(404).send({ success: false, error: 'Código de invitación inválido' });
    }

    if (!tournament.invite_active) {
      return reply.status(403).send({ success: false, error: 'La invitación ya no está activa' });
    }

    if (tournament.status !== 'REGISTRATION_OPEN' && tournament.status !== 'DRAFT' && tournament.status !== 'PUBLISHED') {
      return reply.status(403).send({ success: false, error: 'El torneo no acepta registros en este momento' });
    }

    // Check if tournament is full
    if (tournament.teams.length >= tournament.max_participants) {
      return reply.status(400).send({ success: false, error: 'El torneo está lleno' });
    }

    // Check if user already has a team in this tournament
    const existingTeam = await prisma.teamPlayer.findFirst({
      where: {
        user_id: userId,
        team: { tournament_id: tournament.id }
      }
    });
    if (existingTeam) {
      return reply.status(400).send({ success: false, error: 'Ya estás registrado en este torneo' });
    }

    // Check if tournament requires entry fee payment
    if (tournament.requires_entry_fee && Number(tournament.entry_fee) > 0) {
      // Create team as pending (not approved until payment)
      const team = await prisma.team.create({
        data: {
          tournament_id: tournament.id,
          name: team_name,
          tag: team_tag,
          logo_url: logo_url || null,
          captain_id: userId,
          approved: false // Pending payment
        }
      });

      // Add captain as player
      await prisma.teamPlayer.create({
        data: {
          team_id: team.id,
          user_id: userId,
          is_captain: true,
          role: 'Captain'
        }
      });

      return {
        success: true,
        data: {
          team,
          requires_payment: true,
          entry_fee: tournament.entry_fee,
          message: 'Equipo registrado. Debes pagar la cuota de inscripción para confirmar tu lugar.'
        }
      };
    }

    // Free tournament - register directly
    const team = await prisma.team.create({
      data: {
        tournament_id: tournament.id,
        name: team_name,
        tag: team_tag,
        logo_url: logo_url || null,
        captain_id: userId,
        approved: true
      }
    });

    await prisma.teamPlayer.create({
      data: {
        team_id: team.id,
        user_id: userId,
        is_captain: true,
        role: 'Captain'
      }
    });

    return {
      success: true,
      data: {
        team,
        requires_payment: false,
        message: 'Te has registrado exitosamente al torneo.'
      }
    };
  });

  // Register directly to a tournament (without invite code)
  app.post('/tournaments/:tournamentId/register', {
    preHandler: [authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Register to a tournament directly. Creates a team and adds the user as captain.',
      params: {
        type: 'object',
        properties: {
          tournamentId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['team_name', 'team_tag'],
        properties: {
          team_name: { type: 'string', minLength: 2, maxLength: 50 },
          team_tag: { type: 'string', minLength: 2, maxLength: 6 },
          logo_url: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { tournamentId } = request.params as { tournamentId: string };
    const { team_name, team_tag, logo_url } = request.body as {
      team_name: string;
      team_tag: string;
      logo_url?: string;
    };
    const userId = (request as any).serverUser.id;

    // Find tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true }
    });

    if (!tournament) {
      return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
    }

    if (tournament.status !== 'REGISTRATION_OPEN' && tournament.status !== 'PUBLISHED') {
      return reply.status(403).send({ success: false, error: 'El torneo no acepta registros en este momento' });
    }

    // Check if tournament is full
    if (tournament.teams.length >= tournament.max_participants) {
      return reply.status(400).send({ success: false, error: 'El torneo está lleno' });
    }

    // Check if user already has a team in this tournament
    const existingTeam = await prisma.teamPlayer.findFirst({
      where: {
        user_id: userId,
        team: { tournament_id: tournament.id }
      },
      include: { team: true }
    });
    if (existingTeam) {
      return reply.status(400).send({
        success: false,
        error: 'Ya estás registrado en este torneo',
        data: { team: existingTeam.team }
      });
    }

    // Check if team name or tag already taken in this tournament
    const duplicateTeam = await prisma.team.findFirst({
      where: {
        tournament_id: tournament.id,
        OR: [{ name: team_name }, { tag: team_tag }]
      }
    });
    if (duplicateTeam) {
      return reply.status(400).send({
        success: false,
        error: 'El nombre o tag del equipo ya está en uso en este torneo'
      });
    }

    // Determine if payment is required
    const requiresPayment = tournament.requires_entry_fee && Number(tournament.entry_fee) > 0;

    // Create team
    const team = await prisma.team.create({
      data: {
        tournament_id: tournament.id,
        name: team_name,
        tag: team_tag,
        logo_url: logo_url || null,
        captain_id: userId,
        approved: !requiresPayment // Auto-approve if free
      }
    });

    // Add captain as player
    await prisma.teamPlayer.create({
      data: {
        team_id: team.id,
        user_id: userId,
        is_captain: true,
        role: 'Captain'
      }
    });

    return {
      success: true,
      data: {
        team,
        requires_payment: requiresPayment,
        entry_fee: requiresPayment ? tournament.entry_fee : 0,
        message: requiresPayment
          ? 'Equipo registrado. Debes pagar la cuota de inscripción para confirmar tu lugar.'
          : '¡Te has inscrito exitosamente al torneo!'
      }
    };
  });

  // Check if user is registered in a tournament
  app.get('/tournaments/:tournamentId/my-registration', {
    preHandler: [authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Check if the current user is registered in a tournament',
      params: {
        type: 'object',
        properties: {
          tournamentId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { tournamentId } = request.params as { tournamentId: string };
    const userId = (request as any).serverUser.id;

    const teamPlayer = await prisma.teamPlayer.findFirst({
      where: {
        user_id: userId,
        team: { tournament_id: tournamentId }
      },
      include: {
        team: {
          include: {
            players: { include: { user: { select: { id: true, username: true, avatar_url: true } } } }
          }
        }
      }
    });

    if (teamPlayer) {
      return { success: true, registered: true, data: { team: teamPlayer.team, is_captain: teamPlayer.is_captain } };
    }

    return { success: true, registered: false };
  });

  // Get user's tournaments (tournaments where user is registered)
  app.get('/tournaments/my/list', {
    preHandler: [authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Get all tournaments where the authenticated user is registered'
    }
  }, async (request, reply) => {
    const userId = (request as any).serverUser.id;

    const teamPlayers = await prisma.teamPlayer.findMany({
      where: { user_id: userId },
      include: {
        team: {
          include: {
            tournament: {
              include: { game: true, organizer: { select: { id: true, username: true } } }
            }
          }
        }
      }
    });

    const tournaments = teamPlayers.map(tp => ({
      ...tp.team.tournament,
      my_team: {
        id: tp.team.id,
        name: tp.team.name,
        tag: tp.team.tag,
        seed: tp.team.seed,
        approved: tp.team.approved,
        is_captain: tp.is_captain
      }
    }));

    return { success: true, data: tournaments };
  });

  app.get('/tournaments/:id', {
    schema: {
      tags: ['Tournaments'],
      description: 'Get tournament by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        game: true,
        organizer: { select: { id: true, username: true, avatar_url: true } },
        teams: { include: { players: true } }
      }
    });

    if (!tournament) {
      return { success: false, error: 'Torneo no encontrado' };
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    return {
      success: true,
      data: {
        ...tournament,
        invite_url: tournament.invite_code ? `${baseUrl}/#/tournament/invite/${tournament.invite_code}` : null,
        current_teams: tournament.teams.length,
        spots_left: tournament.max_participants - tournament.teams.length
      }
    };
  });

  app.put('/tournaments/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Update tournament by ID (organizer or admin only)',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          status: { type: 'string' },
          prize_pool: { type: 'number' },
          entry_fee: { type: 'number' },
          description: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const existing = await prisma.tournament.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
    }
    if (existing.organizer_id !== userId && request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo el organizador o admin puede editar este torneo' });
    }

    const updateData = request.body as any;
    // Update requires_entry_fee flag if entry_fee changes
    if (updateData.entry_fee !== undefined) {
      updateData.requires_entry_fee = Number(updateData.entry_fee) > 0;
    }

    const tournament = await prisma.tournament.update({ where: { id }, data: updateData });
    return { success: true, data: tournament };
  });

  app.delete('/tournaments/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Delete tournament by ID (organizer or admin only)',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const existing = await prisma.tournament.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
    }
    if (existing.organizer_id !== userId && request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo el organizador o admin puede eliminar este torneo' });
    }

    await prisma.tournament.delete({ where: { id } });
    return { success: true, message: 'Tournament deleted' };
  });
}
