import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate } from '../middleware';
import { createGameAccountSchema, CreateGameAccountInput } from '../schemas/user.schemas';
import { validateRequest } from '../middleware/validate';

export async function standingController(app: FastifyInstance) {
  // Standings
  app.get('/tournaments/:tournamentId/standings', {
    schema: {
      tags: ['Tournaments'],
      description: 'Get tournament standings',
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
            data: { type: 'array' }
          }
        }
      }
    }
  }, async (request) => {
    const { tournamentId } = request.params as { tournamentId: string };
    const standings = await prisma.standing.findMany({
      where: { tournament_id: tournamentId },
      include: { team: true },
      orderBy: { position: 'asc' }
    });
    return { success: true, data: standings };
  });

  app.post('/standings', {
    schema: {
      tags: ['Tournaments'],
      description: 'Create or update standing',
      body: {
        type: 'object',
        required: ['tournament_id', 'team_id', 'position'],
        properties: {
          tournament_id: { type: 'string' },
          team_id: { type: 'string' },
          played: { type: 'integer' },
          won: { type: 'integer' },
          lost: { type: 'integer' },
          drawn: { type: 'integer' },
          rounds_for: { type: 'integer' },
          rounds_against: { type: 'integer' },
          points: { type: 'integer' },
          position: { type: 'integer' }
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
    const standing = await prisma.standing.create({ data: request.body as any });
    return { success: true, data: standing };
  });

  // Player Stats
  app.get('/players/:userId/stats', {
    schema: {
      tags: ['Players'],
      description: 'Get player statistics',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          game_id: { type: 'string' }
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
  }, async (request) => {
    const { userId } = request.params as { userId: string };
    const { game_id } = request.query as any;
    const stats = await prisma.playerStats.findMany({
      where: { user_id: userId, game_id },
      include: { game: true }
    });
    return { success: true, data: stats };
  });

  // Game Accounts
  app.get('/users/:userId/game-accounts', {
    schema: {
      tags: ['Users'],
      description: 'Get user game accounts',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
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
  }, async (request) => {
    const { userId } = request.params as { userId: string };
    const accounts = await prisma.gameAccount.findMany({
      where: { user_id: userId },
      include: { game: true }
    });
    return { success: true, data: accounts };
  });

  app.post('/game-accounts', {
    preHandler: [authenticate, validateRequest({ body: createGameAccountSchema })],
    schema: {
      tags: ['Users'],
      description: 'Link game account to authenticated user',
    }
  }, async (request) => {
    // SERVER-AUTHORITATIVE: user_id comes from JWT, not body
    const userId = request.serverUser.id;
    const data = request.body as CreateGameAccountInput;
    const account = await prisma.gameAccount.create({
      data: { ...data, user_id: userId }
    });
    return { success: true, data: account };
  });
}
