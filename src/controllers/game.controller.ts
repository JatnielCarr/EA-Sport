import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';

export async function gameController(app: FastifyInstance) {
  // Games
  app.get('/games', {
    schema: {
      tags: ['Games'],
      description: 'Get all games',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  developer: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async () => {
    const games = await prisma.game.findMany();
    return { success: true, data: games };
  });

  app.post('/games', {
    schema: {
      tags: ['Games'],
      description: 'Create a new game',
      body: {
        type: 'object',
        required: ['name', 'slug', 'developer', 'team_size_default'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          developer: { type: 'string' },
          icon_url: { type: 'string' },
          team_size_default: { type: 'integer' }
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
    const game = await prisma.game.create({ data: request.body as any });
    return { success: true, data: game };
  });

  app.get('/games/:id', {
    schema: {
      tags: ['Games'],
      description: 'Get game by ID',
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
    const game = await prisma.game.findUnique({ where: { id } });
    return { success: true, data: game };
  });

  app.put('/games/:id', {
    schema: {
      tags: ['Games'],
      description: 'Update game by ID',
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
          slug: { type: 'string' },
          developer: { type: 'string' },
          icon_url: { type: 'string' },
          team_size_default: { type: 'integer' }
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
    const game = await prisma.game.update({ where: { id }, data: request.body as any });
    return { success: true, data: game };
  });

  app.delete('/games/:id', {
    schema: {
      tags: ['Games'],
      description: 'Delete game by ID',
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
    await prisma.game.delete({ where: { id } });
    return { success: true, message: 'Game deleted' };
  });
}
