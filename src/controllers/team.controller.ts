import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';

export async function teamController(app: FastifyInstance) {
  // Teams
  app.get('/teams', {
    schema: {
      tags: ['Teams'],
      description: 'Get all teams',
      querystring: {
        type: 'object',
        properties: {
          tournament_id: { type: 'string' }
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
    const { tournament_id } = request.query as { tournament_id?: string };
    const teams = await prisma.team.findMany({
      where: tournament_id ? { tournament_id } : undefined,
      include: { captain: true, players: true }
    });
    return { success: true, data: teams };
  });

  app.post('/teams', {
    schema: {
      tags: ['Teams'],
      description: 'Register a team for a tournament',
      body: {
        type: 'object',
        required: ['tournament_id', 'name', 'tag', 'captain_id'],
        properties: {
          tournament_id: { type: 'string' },
          name: { type: 'string' },
          tag: { type: 'string' },
          captain_id: { type: 'string' },
          logo_url: { type: 'string' }
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
    const team = await prisma.team.create({ data: request.body as any });
    return { success: true, data: team };
  });

  app.get('/teams/:id', {
    schema: {
      tags: ['Teams'],
      description: 'Get team by ID',
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
    const team = await prisma.team.findUnique({
      where: { id },
      include: { captain: true, players: { include: { user: true } } }
    });
    return { success: true, data: team };
  });

  app.put('/teams/:id', {
    schema: {
      tags: ['Teams'],
      description: 'Update team',
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
          tag: { type: 'string' },
          logo_url: { type: 'string' },
          approved: { type: 'boolean' },
          disqualified: { type: 'boolean' }
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
    const team = await prisma.team.update({ where: { id }, data: request.body as any });
    return { success: true, data: team };
  });

  app.delete('/teams/:id', {
    schema: {
      tags: ['Teams'],
      description: 'Delete team',
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
    await prisma.team.delete({ where: { id } });
    return { success: true, message: 'Team deleted' };
  });

  // Team Players
  app.post('/teams/:teamId/players', {
    schema: {
      tags: ['Teams'],
      description: 'Add player to team',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['user_id'],
        properties: {
          user_id: { type: 'string' },
          role: { type: 'string' },
          is_substitute: { type: 'boolean' }
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
    const { teamId } = request.params as { teamId: string };
    const body = request.body as any;
    const player = await prisma.teamPlayer.create({
      data: { team_id: teamId, ...body }
    });
    return { success: true, data: player };
  });

  app.delete('/teams/:teamId/players/:playerId', {
    schema: {
      tags: ['Teams'],
      description: 'Remove player from team',
      params: {
        type: 'object',
        properties: {
          teamId: { type: 'string' },
          playerId: { type: 'string' }
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
    const { playerId } = request.params as { playerId: string };
    await prisma.teamPlayer.delete({ where: { id: playerId } });
    return { success: true, message: 'Player removed' };
  });
}
