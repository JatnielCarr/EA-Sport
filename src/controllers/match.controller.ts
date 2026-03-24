import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate, requireRole } from '../middleware';
import { generateBracket, reportResult } from '../services/tournament-engine';
import { aiService } from '../services/ai';

export async function matchController(app: FastifyInstance) {
  // Matches
  app.get('/matches', {
    schema: {
      tags: ['Matches'],
      description: 'Get all matches',
      querystring: {
        type: 'object',
        properties: {
          tournament_id: { type: 'string' },
          status: { type: 'string' }
        }
      },
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
  }, async (request, reply) => {
    try {
      const { tournament_id, status } = request.query as any;
      const whereClause: any = {};

      if (tournament_id) whereClause.tournament_id = tournament_id;
      // Only add status if it's a valid string and not empty
      if (status && typeof status === 'string' && status.trim() !== '') {
        whereClause.status = status;
      }

      console.log('Fetching matches with where:', whereClause);

      const matches = await prisma.match.findMany({
        where: whereClause,
        include: { home_team: true, away_team: true, winner: true }
      });
      return { success: true, data: matches };
    } catch (error) {
      console.error('Error fetching matches:', error);
      return reply.code(500).send({
        success: false,
        error: 'Error al obtener las partidas',
        details: (error as Error).message
      });
    }
  });

  app.post('/matches', {
    schema: {
      tags: ['Matches'],
      description: 'Create a match',
      body: {
        type: 'object',
        required: ['tournament_id', 'round', 'match_number', 'bracket_position'],
        properties: {
          tournament_id: { type: 'string' },
          round: { type: 'integer' },
          match_number: { type: 'integer' },
          bracket_position: { type: 'integer' },
          home_team_id: { type: 'string' },
          away_team_id: { type: 'string' },
          scheduled_datetime: { type: 'string', format: 'date-time' },
          best_of: { type: 'integer' }
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
    const body = request.body as any;
    // Filter out null/undefined values for foreign keys
    const data: any = {
      tournament_id: body.tournament_id,
      round: body.round,
      match_number: body.match_number,
      bracket_position: body.bracket_position,
      best_of: body.best_of || 3,
      status: body.status || 'SCHEDULED'
    };

    // Only add team IDs if they are truthy (not null/undefined/empty)
    if (body.home_team_id) data.home_team_id = body.home_team_id;
    if (body.away_team_id) data.away_team_id = body.away_team_id;
    if (body.scheduled_datetime) data.scheduled_datetime = new Date(body.scheduled_datetime);
    if (body.winner_id) data.winner_id = body.winner_id;

    const match = await prisma.match.create({ data });
    return { success: true, data: match };
  });

  app.put('/matches/:id', {
    schema: {
      tags: ['Matches'],
      description: 'Update match',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        additionalProperties: true,
        properties: {
          status: { type: 'string', enum: ['SCHEDULED', 'CHECK_IN', 'LIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED'] },
          home_score: { type: ['integer', 'null'] },
          away_score: { type: ['integer', 'null'] },
          winner_id: { type: ['string', 'null'], nullable: true },
          scheduled_datetime: { type: ['string', 'null'], format: 'date-time' },
          home_team_id: { type: ['string', 'null'], nullable: true },
          away_team_id: { type: ['string', 'null'], nullable: true },
          round: { type: ['integer', 'null'] },
          match_number: { type: ['integer', 'null'] },
          bracket_position: { type: ['integer', 'null'] },
          best_of: { type: ['integer', 'null'] }
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
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    // Filter out null/undefined values and build update data
    const updateData: any = {};

    if (body.status !== undefined && body.status !== null) {
      updateData.status = body.status;
    }
    if (body.home_score !== undefined && body.home_score !== null) {
      updateData.home_score = body.home_score;
    }
    if (body.away_score !== undefined && body.away_score !== null) {
      updateData.away_score = body.away_score;
    }
    if (body.scheduled_datetime !== undefined && body.scheduled_datetime !== null) {
      updateData.scheduled_datetime = new Date(body.scheduled_datetime);
    }
    if (body.home_team_id !== undefined) {
      updateData.home_team_id = body.home_team_id || null;
    }
    if (body.away_team_id !== undefined) {
      updateData.away_team_id = body.away_team_id || null;
    }

    // Only set winner_id if it's a valid non-empty string
    if (body.winner_id && typeof body.winner_id === 'string' && body.winner_id.trim() !== '') {
      // Verify the team exists
      const team = await prisma.team.findUnique({ where: { id: body.winner_id } });
      if (!team) {
        return reply.code(400).send({
          success: false,
          error: 'El winner_id especificado no existe'
        });
      }
      updateData.winner_id = body.winner_id;
    }

    try {
      const match = await prisma.match.update({ where: { id }, data: updateData });
      return { success: true, data: match };
    } catch (error) {
      console.error('Error updating match:', error);
      return reply.code(500).send({
        success: false,
        error: 'Error al actualizar el partido',
        details: (error as Error).message
      });
    }
  });

  app.delete('/matches/:id', {
    schema: {
      tags: ['Matches'],
      description: 'Delete match by ID',
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
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.match.delete({ where: { id } });
    return { success: true, message: 'Match deleted' };
  });

  app.put('/match-results/:id/validate', {
    schema: {
      tags: ['Matches'],
      description: 'Validate match result',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['validated_by_user_id'],
        properties: {
          validated_by_user_id: { type: 'string' },
          validated: { type: 'boolean' }
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
    const body = request.body as any;
    const result = await prisma.matchResult.update({
      where: { id },
      data: { ...body, validated_at: new Date() }
    });
    return { success: true, data: result };
  });

  app.get('/tournaments/:tournamentId/bracket', {
    schema: {
      tags: ['Tournaments'],
      description: 'Get tournament bracket',
      params: {
        type: 'object',
        properties: {
          tournamentId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                tournament: { type: 'object' },
                matches: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    const { tournamentId } = request.params as { tournamentId: string };
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { game: true, organizer: true }
    });
    const matches = await prisma.match.findMany({
      where: { tournament_id: tournamentId },
      include: { home_team: true, away_team: true, winner: true },
      orderBy: [{ round: 'asc' }, { bracket_position: 'asc' }]
    });
    return { success: true, data: { tournament, matches } };
  });

  // Generate Tournament Bracket
  app.post('/tournaments/:tournamentId/generate-bracket', {
    preHandler: [authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Generate bracket with fair seeding for a tournament. Requires organizer or admin role.',
      params: {
        type: 'object',
        properties: {
          tournamentId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { tournamentId } = request.params as { tournamentId: string };
    const user = (request as any).serverUser;

    // Verify the user is the organizer or admin
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
    }

    if (tournament.organizer_id !== user.id && user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Solo el organizador o un admin puede generar el bracket' });
    }

    try {
      const result = await generateBracket(tournamentId);
      return { success: true, data: result };
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  // Report Match Result
  app.post('/matches/:matchId/report-result', {
    preHandler: [authenticate],
    schema: {
      tags: ['Tournaments'],
      description: 'Report match result and advance winner to next round. Requires organizer, admin, or team captain.',
      params: {
        type: 'object',
        properties: {
          matchId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['winner_id', 'home_score', 'away_score'],
        properties: {
          winner_id: { type: 'string', description: 'ID of the winning team' },
          home_score: { type: 'integer', minimum: 0, description: 'Score of the home team' },
          away_score: { type: 'integer', minimum: 0, description: 'Score of the away team' }
        }
      }
    }
  }, async (request, reply) => {
    const { matchId } = request.params as { matchId: string };
    const { winner_id, home_score, away_score } = request.body as {
      winner_id: string;
      home_score: number;
      away_score: number;
    };
    const user = (request as any).serverUser;

    // Get the match to verify authorization
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        home_team: { include: { captain: true } },
        away_team: { include: { captain: true } }
      }
    });

    if (!match) {
      return reply.status(404).send({ success: false, error: 'Partido no encontrado' });
    }

    // Authorization: organizer, admin, or captain of either team
    const isOrganizer = match.tournament.organizer_id === user.id;
    const isAdmin = user.role === 'ADMIN';
    const isHomeCaptain = match.home_team?.captain_id === user.id;
    const isAwayCaptain = match.away_team?.captain_id === user.id;

    if (!isOrganizer && !isAdmin && !isHomeCaptain && !isAwayCaptain) {
      return reply.status(403).send({
        success: false,
        error: 'Solo el organizador, un admin, o un capitán de equipo puede reportar resultados'
      });
    }

    try {
      const result = await reportResult(matchId, winner_id, home_score, away_score);
      return { success: true, data: result };
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  app.post('/matches/:matchId/results', {
    preHandler: [authenticate],
    schema: {
      tags: ['Matches'],
      description: 'Submit match result as team captain. Both captains must report. Conflicting results auto-trigger a dispute.',
      params: { type: 'object', properties: { matchId: { type: 'string' } } },
      body: {
        type: 'object',
        required: ['reported_by_team_id', 'winning_team_id', 'home_score', 'away_score'],
        properties: {
          reported_by_team_id: { type: 'string' },
          winning_team_id: { type: 'string' },
          home_score: { type: 'integer', minimum: 0 },
          away_score: { type: 'integer', minimum: 0 },
          screenshot_url: { type: 'string' },
          screenshot_base64: { type: 'string', description: 'Base64 encoded screenshot for AI validation' }
        }
      }
    }
  }, async (request, reply) => {
    const { matchId } = request.params as { matchId: string };
    const { reported_by_team_id, winning_team_id, home_score, away_score, screenshot_url, screenshot_base64 } = request.body as any;
    const user = (request as any).serverUser;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: { include: { game: true } },
        home_team: { include: { captain: true } },
        away_team: { include: { captain: true } },
        results: true
      }
    });

    if (!match) return reply.status(404).send({ success: false, error: 'Partido no encontrado' });

    // Verify user is captain of reporting team
    const isHomeCaptain = match.home_team?.captain_id === user.id && reported_by_team_id === match.home_team_id;
    const isAwayCaptain = match.away_team?.captain_id === user.id && reported_by_team_id === match.away_team_id;
    const isAdmin = user.role === 'ADMIN';

    if (!isHomeCaptain && !isAwayCaptain && !isAdmin) {
      return reply.status(403).send({ success: false, error: 'Solo el capitán del equipo puede reportar resultados' });
    }

    // Check if this team already reported
    const alreadyReported = match.results.find((r: any) => r.reported_by_team_id === reported_by_team_id);
    if (alreadyReported) {
      return reply.status(400).send({ success: false, error: 'Tu equipo ya reportó un resultado para este partido' });
    }

    // ===== AI SCREENSHOT VALIDATION =====
    let aiAnalysis: any = null;
    let aiWarning: string | null = null;

    if (screenshot_base64) {
      try {
        aiAnalysis = await aiService.analyzeScreenshot(screenshot_base64, {
          homeTeam: match.home_team?.name || 'Home',
          awayTeam: match.away_team?.name || 'Away',
          game: match.tournament.game?.name || 'Unknown'
        });

        // Check if AI-detected scores conflict with reported scores
        if (aiAnalysis.detected && aiAnalysis.confidence >= 60) {
          if (
            (aiAnalysis.homeScore !== null && aiAnalysis.homeScore !== home_score) ||
            (aiAnalysis.awayScore !== null && aiAnalysis.awayScore !== away_score)
          ) {
            aiWarning = `⚠️ La IA detectó un puntaje diferente al reportado. IA: ${aiAnalysis.homeScore}-${aiAnalysis.awayScore} vs Reportado: ${home_score}-${away_score}. Confianza: ${aiAnalysis.confidence}%`;
            console.warn(`[AI-VALIDATION] Match ${matchId}: ${aiWarning}`);
          }
        }
      } catch (aiError: any) {
        console.warn('AI screenshot analysis failed (non-blocking):', aiError.message);
      }
    }

    // Create the match result
    const result = await prisma.matchResult.create({
      data: {
        match_id: matchId,
        reported_by_user_id: user.id,
        reported_by_team_id,
        winning_team_id,
        home_score,
        away_score,
        screenshot_url: screenshot_url || null,
        ai_analysis: aiAnalysis || undefined,
      }
    });

    // Check if both teams have now reported
    const allResults = [...match.results, result];
    if (allResults.length >= 2) {
      const result1 = allResults[0];
      const result2 = allResults[1];

      // Check for conflicting results
      if (result1.winning_team_id !== result2.winning_team_id ||
        result1.home_score !== result2.home_score ||
        result1.away_score !== result2.away_score) {
        // AUTO-DISPUTE: Conflicting results — freeze match
        await prisma.match.update({
          where: { id: matchId },
          data: { status: 'DISPUTED' }
        });

        // Mark both results as disputed
        await prisma.matchResult.updateMany({
          where: { match_id: matchId },
          data: { disputed: true }
        });

        // Try to notify via Firebase
        try {
          const { getDatabase } = await import('firebase-admin/database');
          const db = getDatabase();
          const notification = {
            type: 'MATCH_DISPUTED',
            matchId,
            tournamentId: match.tournament_id,
            message: `¡Resultados en conflicto! El partido ${match.home_team?.name || 'Home'} vs ${match.away_team?.name || 'Away'} requiere intervención de un administrador.`,
            timestamp: Date.now()
          };

          // Notify both captains
          if (match.home_team?.captain_id) {
            await db.ref(`notifications/${match.home_team.captain_id}`).push(notification);
          }
          if (match.away_team?.captain_id) {
            await db.ref(`notifications/${match.away_team.captain_id}`).push(notification);
          }
          // Notify tournament organizer
          if (match.tournament.organizer_id) {
            await db.ref(`notifications/${match.tournament.organizer_id}`).push({
              ...notification,
              type: 'DISPUTE_REQUIRES_REVIEW',
              message: `Disputa detectada en tu torneo "${match.tournament.name}". Se requiere tu intervención.`
            });
          }
        } catch (fbError) {
          console.warn('Firebase notification failed:', fbError);
        }

        return {
          success: true,
          disputed: true,
          message: 'Los resultados no coinciden. El partido ha sido marcado como EN DISPUTA. Un administrador revisará el caso.',
          data: result
        };
      } else {
        // Results match — auto-validate and advance
        await prisma.matchResult.updateMany({
          where: { match_id: matchId },
          data: { validated: true, validated_at: new Date() }
        });

        try {
          const engineResult = await reportResult(matchId, winning_team_id, home_score, away_score);
          return { success: true, data: engineResult, message: 'Resultado confirmado y avance automático.' };
        } catch (error: any) {
          return { success: true, data: result, message: 'Resultado registrado. Avance manual requerido.' };
        }
      }
    }

    return {
      success: true,
      data: result,
      message: 'Resultado registrado. Esperando el reporte del oponente.',
      ...(aiWarning ? { ai_warning: aiWarning } : {}),
      ...(aiAnalysis ? { ai_analysis: aiAnalysis } : {})
    };
  });

  // =====================================================
  // DISPUTE ROUTES
  // =====================================================

  // Submit a dispute for a match
  app.post('/matches/:matchId/dispute', {
    preHandler: [authenticate],
    schema: {
      tags: ['Disputes'],
      description: 'Open a dispute for a match result',
      params: { type: 'object', properties: { matchId: { type: 'string' } } },
      body: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: { type: 'string', minLength: 10 },
          reported_by_team_id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { matchId } = request.params as { matchId: string };
    const { reason, reported_by_team_id } = request.body as { reason: string; reported_by_team_id?: string };
    const user = (request as any).serverUser;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        home_team: { include: { captain: true } },
        away_team: { include: { captain: true } },
        results: true
      }
    });

    if (!match) return reply.status(404).send({ success: false, error: 'Partido no encontrado' });

    // Freeze match
    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'DISPUTED' }
    });

    // Mark all results as disputed with the reason
    if (match.results.length > 0) {
      await prisma.matchResult.updateMany({
        where: { match_id: matchId },
        data: { disputed: true, dispute_reason: reason }
      });
    }

    // Notify via Firebase
    try {
      const { getDatabase } = await import('firebase-admin/database');
      const db = getDatabase();
      const notification = {
        type: 'MATCH_DISPUTED',
        matchId,
        tournamentId: match.tournament_id,
        reason,
        reportedBy: user.username,
        message: `Disputa abierta: ${user.username} ha disputado el partido. Razón: ${reason.substring(0, 100)}`,
        timestamp: Date.now()
      };

      [match.home_team?.captain_id, match.away_team?.captain_id, match.tournament.organizer_id]
        .filter(Boolean)
        .forEach(async (userId) => {
          try {
            await db.ref(`notifications/${userId}`).push(notification);
          } catch { }
        });
    } catch { }

    return { success: true, message: 'Disputa registrada. El partido ha sido congelado para revisión.' };
  });

  // Admin: Resolve a dispute
  app.post('/matches/:matchId/resolve-dispute', {
    preHandler: [authenticate],
    schema: {
      tags: ['Disputes'],
      description: 'Admin/Organizer resolves a match dispute by selecting the correct result',
      params: { type: 'object', properties: { matchId: { type: 'string' } } },
      body: {
        type: 'object',
        required: ['winner_id', 'home_score', 'away_score'],
        properties: {
          winner_id: { type: 'string' },
          home_score: { type: 'integer', minimum: 0 },
          away_score: { type: 'integer', minimum: 0 },
          admin_notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { matchId } = request.params as { matchId: string };
    const { winner_id, home_score, away_score, admin_notes } = request.body as any;
    const user = (request as any).serverUser;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true }
    });

    if (!match) return reply.status(404).send({ success: false, error: 'Partido no encontrado' });

    const isOrganizer = match.tournament.organizer_id === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isOrganizer && !isAdmin) {
      return reply.status(403).send({ success: false, error: 'Solo el organizador o un admin puede resolver disputas' });
    }

    // Validate results and advance
    await prisma.matchResult.updateMany({
      where: { match_id: matchId },
      data: {
        validated: true,
        validated_by_user_id: user.id,
        validated_at: new Date(),
        disputed: false
      }
    });

    try {
      const result = await reportResult(matchId, winner_id, home_score, away_score);

      // Notify teams
      try {
        const { getDatabase } = await import('firebase-admin/database');
        const db = getDatabase();
        const fullMatch = await prisma.match.findUnique({
          where: { id: matchId },
          include: { home_team: true, away_team: true }
        });
        const notification = {
          type: 'DISPUTE_RESOLVED',
          matchId,
          message: `La disputa ha sido resuelta por un administrador. Ganador: ${winner_id === fullMatch?.home_team_id ? fullMatch?.home_team?.name : fullMatch?.away_team?.name}${admin_notes ? `. Notas: ${admin_notes}` : ''}`,
          timestamp: Date.now()
        };
        [fullMatch?.home_team?.captain_id, fullMatch?.away_team?.captain_id].filter(Boolean).forEach(async (uid) => {
          try { await db.ref(`notifications/${uid}`).push(notification); } catch { }
        });
      } catch { }

      return { success: true, data: result, message: 'Disputa resuelta y resultado validado.' };
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  // Get all disputed matches (Admin/Organizer)
  app.get('/disputes', {
    preHandler: [authenticate],
    schema: { tags: ['Disputes'], description: 'Get all disputed matches' }
  }, async (request, reply) => {
    const user = (request as any).serverUser;
    const isAdmin = user.role === 'ADMIN';

    const whereClause: any = { status: 'DISPUTED' };
    if (!isAdmin) {
      whereClause.tournament = { organizer_id: user.id };
    }

    const disputes = await prisma.match.findMany({
      where: whereClause,
      include: {
        tournament: { select: { id: true, name: true, organizer_id: true } },
        home_team: { select: { id: true, name: true, tag: true, captain_id: true } },
        away_team: { select: { id: true, name: true, tag: true, captain_id: true } },
        results: {
          include: {
            reported_by_team: { select: { id: true, name: true } },
            reported_by_user: { select: { id: true, username: true } }
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    return { success: true, data: disputes };
  });

  // Get user's disputes
  app.get('/disputes/my', {
    preHandler: [authenticate],
    schema: { tags: ['Disputes'], description: 'Get disputes involving the current user' }
  }, async (request, reply) => {
    const user = (request as any).serverUser;

    const myTeams = await prisma.teamPlayer.findMany({
      where: { user_id: user.id },
      select: { team_id: true }
    });
    const teamIds = myTeams.map(t => t.team_id);

    const disputes = await prisma.match.findMany({
      where: {
        status: 'DISPUTED',
        OR: [
          { home_team_id: { in: teamIds } },
          { away_team_id: { in: teamIds } }
        ]
      },
      include: {
        tournament: { select: { id: true, name: true } },
        home_team: { select: { id: true, name: true, tag: true } },
        away_team: { select: { id: true, name: true, tag: true } },
        results: true
      },
      orderBy: { updated_at: 'desc' }
    });

    return { success: true, data: disputes };
  });

  app.get('/matches/:matchId', {
    schema: {
      tags: ['Matches'],
      description: 'Get match details by ID with teams and results'
    }
  }, async (request, reply) => {
    const { matchId } = request.params as { matchId: string };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: { select: { id: true, name: true, slug: true, organizer_id: true } },
        home_team: {
          include: {
            captain: { select: { id: true, username: true } },
            players: { include: { user: { select: { id: true, username: true } } } }
          }
        },
        away_team: {
          include: {
            captain: { select: { id: true, username: true } },
            players: { include: { user: { select: { id: true, username: true } } } }
          }
        },
        winner: { select: { id: true, name: true, tag: true } },
        results: {
          include: {
            reported_by_team: { select: { id: true, name: true, tag: true } },
            reported_by_user: { select: { id: true, username: true } },
            winning_team: { select: { id: true, name: true, tag: true } }
          },
          orderBy: { submitted_at: 'asc' }
        }
      }
    });

    if (!match) return reply.status(404).send({ success: false, error: 'Partido no encontrado' });

    return { success: true, data: match };
  });

  // =====================================================
  // SSE LIVE BRACKET UPDATES
  // =====================================================

  app.get('/tournaments/:id/bracket/live', {
    schema: {
      tags: ['Tournaments'],
      description: 'Server-Sent Events stream for real-time bracket updates'
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial bracket state
    const matches = await prisma.match.findMany({
      where: { tournament_id: id },
      include: {
        home_team: { select: { id: true, name: true, tag: true } },
        away_team: { select: { id: true, name: true, tag: true } },
        winner: { select: { id: true, name: true, tag: true } }
      },
      orderBy: [{ round: 'asc' }, { match_number: 'asc' }]
    });

    reply.raw.write(`data: ${JSON.stringify({ type: 'BRACKET_FULL', data: matches })}\n\n`);

    // Poll for updates every 3 seconds
    const interval = setInterval(async () => {
      try {
        const updatedMatches = await prisma.match.findMany({
          where: { tournament_id: id },
          include: {
            home_team: { select: { id: true, name: true, tag: true } },
            away_team: { select: { id: true, name: true, tag: true } },
            winner: { select: { id: true, name: true, tag: true } }
          },
          orderBy: [{ round: 'asc' }, { match_number: 'asc' }]
        });
        reply.raw.write(`data: ${JSON.stringify({ type: 'BRACKET_UPDATE', data: updatedMatches, timestamp: Date.now() })}\n\n`);
      } catch {
        clearInterval(interval);
      }
    }, 3000);

    // Keep alive ping
    const keepAlive = setInterval(() => {
      try { reply.raw.write(': keepalive\n\n'); } catch { clearInterval(keepAlive); }
    }, 15000);

    // Clean up on close
    request.raw.on('close', () => {
      clearInterval(interval);
      clearInterval(keepAlive);
    });
  });
}
