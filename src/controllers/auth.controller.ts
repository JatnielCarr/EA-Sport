import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { authenticate } from '../middleware';
import { validateRequest } from '../middleware/validate';
import { loginSchema, registerSchema, changePasswordSchema, LoginInput, RegisterInput, ChangePasswordInput } from '../schemas/auth.schemas';
import { createRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../services/token.service';

export async function authController(app: FastifyInstance) {

  // Login
  app.post('/auth/login', {
    preHandler: [validateRequest({ body: loginSchema })],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: (_request: any, context: any) => ({
          success: false,
          error: {
            code: 'AUTH_RATE_LIMITED',
            message: `Demasiados intentos de inicio de sesión. Máximo ${context.max} por minuto. Intenta de nuevo después de ${context.after}.`,
            retryAfter: context.after
          }
        })
      }
    },
    schema: {
      tags: ['Auth'],
      description: 'Login with email and password',
    }
  }, async (request, reply) => {
    const { email, password } = request.body as LoginInput;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Invalid credentials' });
    }

    // Verify password using bcrypt
    let validPassword = false;
    const isHashedPassword = user.password_hash.startsWith('$2');

    if (isHashedPassword) {
      try {
        validPassword = await bcrypt.compare(password, user.password_hash);
      } catch {
        validPassword = false;
      }
    } else {
      // Legacy plain text password support (auto-migrated)
      validPassword = password === user.password_hash;

      if (validPassword) {
        console.warn(`[SECURITY] User ${user.id} has legacy plain text password - migrating to bcrypt`);
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

    // Check if user is banned
    if (user.banned) {
      const now = new Date();
      if (user.ban_duration === 'permanent' || (user.banned_until && user.banned_until > now)) {
        return reply.status(403).send({
          success: false,
          error: 'ACCOUNT_BANNED',
          banned: true,
          ban_info: {
            username: user.username,
            reason: user.ban_reason || 'Violación de las reglas de la comunidad',
            duration: user.ban_duration,
            banned_at: user.banned_at,
            banned_until: user.banned_until
          }
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { banned: false, ban_reason: null, ban_duration: null, banned_at: null, banned_until: null }
        });
      }
    }

    // Generate short-lived access token (15 min) + long-lived refresh token (7 days)
    const accessToken = app.jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      { expiresIn: '15m' }
    );
    const refreshToken = await createRefreshToken(user.id);

    return {
      success: true,
      data: {
        token: accessToken, // backward compatibility
        tokens: { accessToken, refreshToken },
        user: { id: user.id, email: user.email, username: user.username, role: user.role }
      }
    };
  });

  // Register
  app.post('/auth/register', {
    preHandler: [validateRequest({ body: registerSchema })],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: (_request: any, context: any) => ({
          success: false,
          error: {
            code: 'AUTH_RATE_LIMITED',
            message: `Demasiados intentos de registro. Máximo ${context.max} por minuto. Intenta de nuevo después de ${context.after}.`,
            retryAfter: context.after
          }
        })
      }
    },
    schema: {
      tags: ['Auth'],
      description: 'Register a new user',
    }
  }, async (request, reply) => {
    const { email, username, password } = request.body as RegisterInput;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return reply.status(400).send({ success: false, error: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // SERVER-AUTHORITATIVE: role is ALWAYS 'USER' for self-registration
    const user = await prisma.user.create({
      data: { email, username, password_hash, role: 'USER' }
    });

    // Generate short-lived access token (15 min) + long-lived refresh token (7 days)
    const accessToken = app.jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      { expiresIn: '15m' }
    );
    const refreshToken = await createRefreshToken(user.id);

    return {
      success: true,
      data: {
        token: accessToken, // backward compatibility
        tokens: { accessToken, refreshToken },
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
    preHandler: [authenticate, validateRequest({ body: changePasswordSchema })],
    schema: {
      tags: ['Auth'],
      description: 'Change user password',
    }
  }, async (request, reply) => {
    // SERVER-AUTHORITATIVE: user ID comes from JWT, not from request body
    const userId = request.serverUser.id;
    const { currentPassword, newPassword } = request.body as ChangePasswordInput;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return reply.status(400).send({ success: false, error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash }
    });

    // Revoke all refresh tokens when password changes (security: force re-login everywhere)
    await revokeAllUserTokens(userId);

    return { success: true, message: 'Password changed successfully. All sessions have been logged out.' };
  });

  // Refresh access token
  app.post('/auth/refresh', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
        errorResponseBuilder: (_request: any, context: any) => ({
          success: false,
          error: {
            code: 'AUTH_RATE_LIMITED',
            message: `Demasiadas solicitudes de refresh. Intenta de nuevo después de ${context.after}.`,
            retryAfter: context.after
          }
        })
      }
    },
    schema: {
      tags: ['Auth'],
      description: 'Refresh access token using a valid refresh token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Refresh token es requerido' }
      });
    }

    const userId = await verifyRefreshToken(refreshToken);
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token inválido o expirado. Inicia sesión de nuevo.' }
      });
    }

    // Load fresh user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, role: true, banned: true }
    });

    if (!user || user.banned) {
      // Revoke the token if user is banned or deleted
      await revokeRefreshToken(refreshToken);
      return reply.status(401).send({
        success: false,
        error: { code: 'ACCOUNT_UNAVAILABLE', message: 'Cuenta no disponible' }
      });
    }

    // Generate new short-lived access token
    const accessToken = app.jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      { expiresIn: '15m' }
    );

    return {
      success: true,
      data: {
        token: accessToken, // backward compatibility
        tokens: { accessToken },
        user: { id: user.id, email: user.email, username: user.username, role: user.role }
      }
    };
  });

  // Logout (revoke refresh token)
  app.post('/auth/logout', {
    schema: {
      tags: ['Auth'],
      description: 'Logout by revoking the refresh token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Refresh token es requerido' }
      });
    }

    await revokeRefreshToken(refreshToken);
    return { success: true, message: 'Sesión cerrada exitosamente' };
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
