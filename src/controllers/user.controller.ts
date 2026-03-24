import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { authenticate, requireRole } from '../middleware';
import { validateRequest } from '../middleware/validate';
import { createUserSchema, updateUserSchema, banUserSchema, CreateUserInput, UpdateUserInput, BanUserInput } from '../schemas/user.schemas';

export async function userController(app: FastifyInstance) {
  // Users
  // SERVER-AUTHORITATIVE: All user management routes require ADMIN role
  app.get('/users', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      tags: ['Users'],
      description: 'Get all users (ADMIN only)',
    }
  }, async () => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true, role: true, created_at: true, banned: true }
    });
    return { success: true, data: users };
  });

  app.post('/users', {
    preHandler: [authenticate, requireRole('ADMIN'), validateRequest({ body: createUserSchema })],
    schema: {
      tags: ['Users'],
      description: 'Create a new user (ADMIN only)',
    }
  }, async (request) => {
    const { email, username, password, role } = request.body as CreateUserInput;
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password_hash, role }
    });
    return { success: true, data: user };
  });

  app.get('/users/:id', {
    preHandler: [authenticate],
    schema: {
      tags: ['Users'],
      description: 'Get user by ID',
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, role: true, created_at: true, avatar_url: true, banner_url: true, description: true, verified: true }
    });
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }
    return { success: true, data: user };
  });

  app.put('/users/:id', {
    preHandler: [authenticate, requireRole('ADMIN'), validateRequest({ body: updateUserSchema })],
    schema: {
      tags: ['Users'],
      description: 'Update user by ID (ADMIN only)',
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as UpdateUserInput;
    const user = await prisma.user.update({ where: { id }, data: updateData });
    return { success: true, data: user };
  });

  app.delete('/users/:id', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      tags: ['Users'],
      description: 'Delete user by ID (ADMIN only)',
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.user.delete({ where: { id } });
    return { success: true, message: 'User deleted' };
  });

  // Ban user
  app.put('/users/:id/ban', {
    preHandler: [authenticate, requireRole('ADMIN'), validateRequest({ body: banUserSchema })],
    schema: {
      tags: ['Users'],
      description: 'Ban a user by ID (ADMIN only)',
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { duration, reason } = request.body as BanUserInput;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    // SERVER-AUTHORITATIVE: Prevent banning other admins
    if (targetUser.role === 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'No se puede banear a otro administrador' });
    }

    let banned_until: Date | null = null;
    if (duration !== 'permanent') {
      const days = parseInt(duration.replace('d', ''));
      banned_until = new Date();
      banned_until.setDate(banned_until.getDate() + days);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        banned: true,
        ban_reason: reason,
        ban_duration: duration,
        banned_at: new Date(),
        banned_until
      }
    });

    return { success: true, data: user };
  });

  // Unban user
  app.put('/users/:id/unban', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      tags: ['Users'],
      description: 'Unban a user by ID (ADMIN only)',
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        banned: false,
        ban_reason: null,
        ban_duration: null,
        banned_at: null,
        banned_until: null
      }
    });

    return { success: true, data: user };
  });
}
