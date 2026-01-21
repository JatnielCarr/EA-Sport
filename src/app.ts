import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import bcrypt from 'bcrypt';
import { swaggerConfig } from './config/swagger';
import { prisma } from './config/database';
import { firebaseAuthRoutes } from './routes/firebase-auth.routes';
import { telegramRoutes } from './routes/telegram.routes';


const JWT_SECRET = process.env.JWT_SECRET || 'ea-sports-tournament-secret-key-2024';

export async function buildApp() {
  const app = Fastify({
    logger: true,
    disableRequestLogging: process.env.NODE_ENV === 'test'
  });

  // CORS Configuration - More flexible for development and production
  const CORS_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://localhost:4173', // Vite preview
      'http://127.0.0.1:4173'
    ];

  // Register plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });

  // Register JWT
  await app.register(fastifyJwt, {
    secret: JWT_SECRET
  });

  // Authentication decorator
  app.decorate('authenticate', async function (request: any, reply: any) {
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

  // Register Firebase Auth Routes
  await app.register(firebaseAuthRoutes);

  // Register Telegram Routes
  await app.register(telegramRoutes);

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

    // Verify password using bcrypt
    let validPassword = false;
    const isHashedPassword = user.password_hash.startsWith('$2');

    if (isHashedPassword) {
      // Standard bcrypt comparison for hashed passwords
      try {
        validPassword = await bcrypt.compare(password, user.password_hash);
      } catch {
        validPassword = false;
      }
    } else {
      // Legacy plain text password support (will be auto-migrated)
      // WARNING: This should be removed once all passwords are migrated
      validPassword = password === user.password_hash;

      if (validPassword) {
        // Log migration for monitoring
        console.warn(`[SECURITY] User ${user.id} has legacy plain text password - migrating to bcrypt`);

        // Migrate to hashed password immediately
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password_hash: hashedPassword }
        });
      }
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

  // Change password
  app.post('/auth/change-password', {
    schema: {
      tags: ['Auth'],
      description: 'Change user password',
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      await request.jwtVerify();
      const userData = request.user as any;
      const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };

      const user = await prisma.user.findUnique({ where: { id: userData.id } });

      if (!user) {
        return reply.status(404).send({ success: false, error: 'User not found' });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return reply.status(400).send({ success: false, error: 'Current password is incorrect' });
      }

      // Hash and update new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userData.id },
        data: { password_hash: newPasswordHash }
      });

      return { success: true, message: 'Password changed successfully' };
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
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string' },
          username: { type: 'string' },
          password: { type: 'string', minLength: 6 },
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
    const { email, username, password, role } = request.body as { email: string; username: string; password: string; role?: string };

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password_hash,
        role: (role as any) || 'USER'
      }
    });
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

  // =====================================================
  // CLANS ROUTES
  // =====================================================

  // Get all clans
  app.get('/clans', {
    schema: {
      tags: ['Clans'],
      description: 'Get all clans with optional filters',
      querystring: {
        type: 'object',
        properties: {
          access_type: { type: 'string', enum: ['OPEN', 'INVITE_ONLY', 'CLOSED'] },
          search: { type: 'string' },
          location: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { access_type, search, location } = request.query as {
      access_type?: string;
      search?: string;
      location?: string;
    };

    const where: any = {};
    if (access_type) where.access_type = access_type;
    if (location) where.location = { contains: location };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tag: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const clans = await prisma.clan.findMany({
      where,
      include: {
        leader: { select: { id: true, username: true } },
        members: { select: { id: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const clansWithCount = clans.map(clan => ({
      ...clan,
      member_count: clan.members.length
    }));

    return { success: true, data: clansWithCount };
  });

  // Get clan by ID
  app.get('/clans/:id', {
    schema: {
      tags: ['Clans'],
      description: 'Get clan details by ID'
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, username: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, username: true } }
          },
          orderBy: { joined_at: 'asc' }
        },
        requests: {
          where: { status: 'PENDING' },
          include: {
            user: { select: { id: true, username: true } }
          }
        }
      }
    });

    if (!clan) {
      return reply.status(404).send({ success: false, error: 'Clan not found' });
    }

    return { success: true, data: clan };
  });

  // Create clan
  app.post('/clans', {
    schema: {
      tags: ['Clans'],
      description: 'Create a new clan',
      body: {
        type: 'object',
        required: ['name', 'tag', 'leader_id'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 50 },
          tag: { type: 'string', minLength: 2, maxLength: 5 },
          banner_url: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          access_type: { type: 'string', enum: ['OPEN', 'INVITE_ONLY', 'CLOSED'] },
          requirements: { type: 'string' },
          max_members: { type: 'integer', minimum: 5, maximum: 100 },
          leader_id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const data = request.body as any;

    // Check if user already leads a clan
    const existingClan = await prisma.clan.findFirst({
      where: { leader_id: data.leader_id }
    });

    if (existingClan) {
      return reply.status(400).send({
        success: false,
        error: 'User already leads a clan'
      });
    }

    // Create clan and add leader as member
    const clan = await prisma.clan.create({
      data: {
        ...data,
        members: {
          create: {
            user_id: data.leader_id,
            role: 'LEADER'
          }
        }
      },
      include: {
        leader: { select: { id: true, username: true } },
        members: true
      }
    });

    return { success: true, data: clan };
  });

  // Update clan
  app.put('/clans/:id', {
    schema: {
      tags: ['Clans'],
      description: 'Update clan details',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          tag: { type: 'string' },
          banner_url: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          access_type: { type: 'string', enum: ['OPEN', 'INVITE_ONLY', 'CLOSED'] },
          requirements: { type: 'string' },
          max_members: { type: 'integer' }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    const clan = await prisma.clan.update({
      where: { id },
      data: request.body as any
    });
    return { success: true, data: clan };
  });

  // Delete clan
  app.delete('/clans/:id', {
    schema: {
      tags: ['Clans'],
      description: 'Delete a clan'
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.clan.delete({ where: { id } });
    return { success: true, message: 'Clan deleted' };
  });

  // Join clan (for OPEN clans)
  app.post('/clans/:id/join', {
    schema: {
      tags: ['Clans'],
      description: 'Join an open clan',
      body: {
        type: 'object',
        required: ['user_id'],
        properties: {
          user_id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { user_id } = request.body as { user_id: string };

    const clan = await prisma.clan.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!clan) {
      return reply.status(404).send({ success: false, error: 'Clan not found' });
    }

    if (clan.access_type !== 'OPEN') {
      return reply.status(403).send({
        success: false,
        error: 'This clan requires an invitation to join'
      });
    }

    if (clan.members.length >= clan.max_members) {
      return reply.status(400).send({
        success: false,
        error: 'Clan is full'
      });
    }

    // Check if already a member
    const existingMember = await prisma.clanMember.findUnique({
      where: { clan_id_user_id: { clan_id: id, user_id } }
    });

    if (existingMember) {
      return reply.status(400).send({
        success: false,
        error: 'Already a member of this clan'
      });
    }

    const member = await prisma.clanMember.create({
      data: { clan_id: id, user_id, role: 'MEMBER' },
      include: { user: { select: { id: true, username: true } } }
    });

    return { success: true, data: member };
  });

  // Request to join clan (for INVITE_ONLY clans)
  app.post('/clans/:id/request', {
    schema: {
      tags: ['Clans'],
      description: 'Request to join a clan',
      body: {
        type: 'object',
        required: ['user_id', 'title', 'message'],
        properties: {
          user_id: { type: 'string' },
          title: { type: 'string', minLength: 5, maxLength: 100 },
          message: { type: 'string', minLength: 10, maxLength: 500 }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { user_id, title, message } = request.body as {
      user_id: string;
      title: string;
      message: string;
    };

    const clan = await prisma.clan.findUnique({ where: { id } });

    if (!clan) {
      return reply.status(404).send({ success: false, error: 'Clan not found' });
    }

    if (clan.access_type === 'CLOSED') {
      return reply.status(403).send({
        success: false,
        error: 'This clan is not accepting new members'
      });
    }

    // Check for existing pending request
    const existingRequest = await prisma.clanRequest.findFirst({
      where: { clan_id: id, user_id, status: 'PENDING' }
    });

    if (existingRequest) {
      return reply.status(400).send({
        success: false,
        error: 'You already have a pending request'
      });
    }

    const clanRequest = await prisma.clanRequest.create({
      data: { clan_id: id, user_id, title, message },
      include: { user: { select: { id: true, username: true } } }
    });

    return { success: true, data: clanRequest };
  });

  // Get clan requests
  app.get('/clans/:id/requests', {
    schema: {
      tags: ['Clans'],
      description: 'Get pending requests for a clan'
    }
  }, async (request) => {
    const { id } = request.params as { id: string };

    const requests = await prisma.clanRequest.findMany({
      where: { clan_id: id },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { created_at: 'desc' }
    });

    return { success: true, data: requests };
  });

  // Approve/Reject request
  app.post('/clans/:id/requests/:requestId/:action', {
    schema: {
      tags: ['Clans'],
      description: 'Approve or reject a join request'
    }
  }, async (request, reply) => {
    const { id, requestId, action } = request.params as {
      id: string;
      requestId: string;
      action: 'approve' | 'reject';
    };

    const clanRequest = await prisma.clanRequest.findUnique({
      where: { id: requestId }
    });

    if (!clanRequest || clanRequest.clan_id !== id) {
      return reply.status(404).send({ success: false, error: 'Request not found' });
    }

    if (action === 'approve') {
      // Add user to clan
      await prisma.clanMember.create({
        data: {
          clan_id: id,
          user_id: clanRequest.user_id,
          role: 'MEMBER'
        }
      });

      await prisma.clanRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });

      return { success: true, message: 'Request approved' };
    } else {
      await prisma.clanRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });

      return { success: true, message: 'Request rejected' };
    }
  });

  // Leave clan
  app.delete('/clans/:id/members/:userId', {
    schema: {
      tags: ['Clans'],
      description: 'Remove a member from clan or leave clan'
    }
  }, async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };

    const clan = await prisma.clan.findUnique({ where: { id } });

    if (!clan) {
      return reply.status(404).send({ success: false, error: 'Clan not found' });
    }

    // Cannot remove the leader
    if (clan.leader_id === userId) {
      return reply.status(400).send({
        success: false,
        error: 'Leader cannot leave the clan. Transfer leadership first or delete the clan.'
      });
    }

    await prisma.clanMember.delete({
      where: { clan_id_user_id: { clan_id: id, user_id: userId } }
    });

    return { success: true, message: 'Member removed from clan' };
  });

  // Update member role
  app.put('/clans/:id/members/:userId/role', {
    schema: {
      tags: ['Clans'],
      description: 'Update member role',
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['OFFICER', 'MEMBER'] }
        }
      }
    }
  }, async (request) => {
    const { id, userId } = request.params as { id: string; userId: string };
    const { role } = request.body as { role: string };

    const member = await prisma.clanMember.update({
      where: { clan_id_user_id: { clan_id: id, user_id: userId } },
      data: { role: role as any }
    });

    return { success: true, data: member };
  });

  // Get clan messages (chat)
  app.get('/clans/:id/messages', {
    schema: {
      tags: ['Clans'],
      description: 'Get clan chat messages',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 50 },
          before: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { limit = 50, before } = request.query as { limit?: number; before?: string };

    const where: any = { clan_id: id };
    if (before) {
      where.created_at = { lt: new Date(before) };
    }

    const messages = await prisma.clanMessage.findMany({
      where,
      include: { user: { select: { id: true, username: true } } },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return { success: true, data: messages.reverse() };
  });

  // Send clan message
  app.post('/clans/:id/messages', {
    schema: {
      tags: ['Clans'],
      description: 'Send a message in clan chat',
      body: {
        type: 'object',
        required: ['user_id', 'content'],
        properties: {
          user_id: { type: 'string' },
          content: { type: 'string', minLength: 1, maxLength: 1000 },
          is_announcement: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { user_id, content, is_announcement } = request.body as {
      user_id: string;
      content: string;
      is_announcement?: boolean;
    };

    // Verify user is a member
    const member = await prisma.clanMember.findUnique({
      where: { clan_id_user_id: { clan_id: id, user_id } }
    });

    if (!member) {
      return reply.status(403).send({
        success: false,
        error: 'You must be a clan member to send messages'
      });
    }

    // Only leader/officers can send announcements
    if (is_announcement && member.role === 'MEMBER') {
      return reply.status(403).send({
        success: false,
        error: 'Only leaders and officers can send announcements'
      });
    }

    const message = await prisma.clanMessage.create({
      data: {
        clan_id: id,
        user_id,
        content,
        is_announcement: is_announcement || false
      },
      include: { user: { select: { id: true, username: true } } }
    });

    return { success: true, data: message };
  });

  // Get user's clan
  app.get('/users/:userId/clan', {
    schema: {
      tags: ['Clans'],
      description: 'Get the clan a user belongs to'
    }
  }, async (request) => {
    const { userId } = request.params as { userId: string };

    const membership = await prisma.clanMember.findFirst({
      where: { user_id: userId },
      include: {
        clan: {
          include: {
            leader: { select: { id: true, username: true } },
            members: { select: { id: true } }
          }
        }
      }
    });

    if (!membership) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        ...membership.clan,
        member_count: membership.clan.members.length,
        user_role: membership.role
      }
    };
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