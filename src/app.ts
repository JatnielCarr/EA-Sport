import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import bcrypt from 'bcrypt';
import { swaggerConfig } from './config/swagger';
import { prisma } from './config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'ea-sports-tournament-secret-key-2024';

export async function buildApp() {
  const app = Fastify({
    logger: true,
    disableRequestLogging: process.env.NODE_ENV === 'test'
  });

  // Register plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true
  });

  // Register JWT
  await app.register(fastifyJwt, {
    secret: JWT_SECRET
  });

  // Authentication decorator
  app.decorate('authenticate', async function(request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
  });

  // Register Swagger
  await app.register(require('@fastify/swagger'), swaggerConfig);
  await app.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header
  });

  // =====================================================
  // AUTH ROUTES
  // =====================================================

  // Login
  app.post('/auth/login', {
    schema: {
      tags: ['Auth'],
      description: 'Login with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
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
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    username: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Invalid credentials' });
    }

    // Verify password - try bcrypt first, then plain text for legacy passwords
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.password_hash);
    } catch {
      // If bcrypt fails, check if it's a plain text password (legacy)
      validPassword = password === user.password_hash;
    }
    
    // Also check plain text comparison for non-hashed passwords
    if (!validPassword) {
      validPassword = password === user.password_hash;
    }
    
    // If valid with plain password, update to hashed version
    if (validPassword && !user.password_hash.startsWith('$2')) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password_hash: hashedPassword }
      });
    }
    
    if (!validPassword) {
      return reply.status(401).send({ success: false, error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = app.jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        role: user.role 
      },
      { expiresIn: '24h' }
    );

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    };
  });

  // Register
  app.post('/auth/register', {
    schema: {
      tags: ['Auth'],
      description: 'Register a new user',
      body: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 3 },
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    const { email, username, password } = request.body as { email: string; username: string; password: string };

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return reply.status(400).send({ success: false, error: 'User already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, username, password_hash, role: 'USER' }
    });

    const token = app.jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      { expiresIn: '24h' }
    );

    return {
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, username: user.username, role: user.role }
      }
    };
  });

  // Get current user
  app.get('/auth/me', {
    schema: {
      tags: ['Auth'],
      description: 'Get current authenticated user',
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      await request.jwtVerify();
      const userData = request.user as any;
      
      const user = await prisma.user.findUnique({ 
        where: { id: userData.id },
        select: { id: true, email: true, username: true, role: true, created_at: true }
      });

      if (!user) {
        return reply.status(404).send({ success: false, error: 'User not found' });
      }

      return { success: true, data: user };
    } catch (err) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // CRUD Routes

  // Users
  app.get('/users', {
    schema: {
      tags: ['Users'],
      description: 'Get all users',
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
                  email: { type: 'string' },
                  username: { type: 'string' },
                  role: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async () => {
    const users = await prisma.user.findMany();
    return { success: true, data: users };
  });

  app.post('/users', {
    schema: {
      tags: ['Users'],
      description: 'Create a new user',
      body: {
        type: 'object',
        required: ['email', 'username', 'password_hash'],
        properties: {
          email: { type: 'string' },
          username: { type: 'string' },
          password_hash: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ORGANIZER', 'ADMIN'] }
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
    const user = await prisma.user.create({ data: request.body as any });
    return { success: true, data: user };
  });

  app.get('/users/:id', {
    schema: {
      tags: ['Users'],
      description: 'Get user by ID',
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
    const user = await prisma.user.findUnique({ where: { id } });
    return { success: true, data: user };
  });

  app.put('/users/:id', {
    schema: {
      tags: ['Users'],
      description: 'Update user by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          username: { type: 'string' },
          role: { type: 'string' }
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
    const user = await prisma.user.update({ where: { id }, data: request.body as any });
    return { success: true, data: user };
  });

  app.delete('/users/:id', {
    schema: {
      tags: ['Users'],
      description: 'Delete user by ID',
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
    await prisma.user.delete({ where: { id } });
    return { success: true, message: 'User deleted' };
  });

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
    schema: {
      tags: ['Tournaments'],
      description: 'Create a new tournament',
      body: {
        type: 'object',
        required: ['name', 'slug', 'game_id', 'organizer_id', 'format', 'team_size', 'start_date'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          game_id: { type: 'string' },
          organizer_id: { type: 'string' },
          format: { type: 'string' },
          team_size: { type: 'integer' },
          max_participants: { type: 'integer' },
          region: { type: 'string' },
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
  }, async (request) => {
    const tournament = await prisma.tournament.create({ data: request.body as any });
    return { success: true, data: tournament };
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
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    return { success: true, data: tournament };
  });

  app.put('/tournaments/:id', {
    schema: {
      tags: ['Tournaments'],
      description: 'Update tournament by ID',
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
          prize_pool: { type: 'number' }
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
    const tournament = await prisma.tournament.update({ where: { id }, data: request.body as any });
    return { success: true, data: tournament };
  });

  app.delete('/tournaments/:id', {
    schema: {
      tags: ['Tournaments'],
      description: 'Delete tournament by ID',
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
    await prisma.tournament.delete({ where: { id } });
    return { success: true, message: 'Tournament deleted' };
  });

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
  }, async (request) => {
    const { tournament_id, status } = request.query as any;
    const matches = await prisma.match.findMany({
      where: {
        tournament_id,
        status
      },
      include: { home_team: true, away_team: true, winner: true }
    });
    return { success: true, data: matches };
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
    const match = await prisma.match.create({ data: request.body as any });
    return { success: true, data: match };
  });

  app.get('/matches/:id', {
    schema: {
      tags: ['Matches'],
      description: 'Get match by ID',
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
    const match = await prisma.match.findUnique({ 
      where: { id },
      include: { 
        home_team: { include: { players: { include: { user: true } } } }, 
        away_team: { include: { players: { include: { user: true } } } },
        winner: true,
        results: true
      }
    });
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
        properties: {
          status: { type: 'string', enum: ['SCHEDULED', 'CHECK_IN', 'LIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED'] },
          home_score: { type: 'integer' },
          away_score: { type: 'integer' },
          winner_id: { type: 'string' },
          scheduled_datetime: { type: 'string', format: 'date-time' }
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
    const match = await prisma.match.update({ where: { id }, data: request.body as any });
    return { success: true, data: match };
  });

  // Match Results
  app.post('/matches/:matchId/results', {
    schema: {
      tags: ['Matches'],
      description: 'Report match result',
      params: {
        type: 'object',
        properties: {
          matchId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['reported_by_user_id', 'reported_by_team_id', 'winning_team_id', 'home_score', 'away_score'],
        properties: {
          reported_by_user_id: { type: 'string' },
          reported_by_team_id: { type: 'string' },
          winning_team_id: { type: 'string' },
          home_score: { type: 'integer' },
          away_score: { type: 'integer' },
          screenshot_url: { type: 'string' },
          replay_file_url: { type: 'string' }
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
    const { matchId } = request.params as { matchId: string };
    const body = request.body as any;
    const result = await prisma.matchResult.create({ 
      data: { match_id: matchId, ...body }
    });
    return { success: true, data: result };
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
    schema: {
      tags: ['Users'],
      description: 'Link game account to user',
      body: {
        type: 'object',
        required: ['user_id', 'game_id', 'game_username', 'account_id'],
        properties: {
          user_id: { type: 'string' },
          game_id: { type: 'string' },
          game_username: { type: 'string' },
          account_id: { type: 'string' },
          rank: { type: 'string' }
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
    const account = await prisma.gameAccount.create({ data: request.body as any });
    return { success: true, data: account };
  });

  // Tournament Bracket
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

  // 404 handler
  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found'
      }
    });
  });

  return app;
}