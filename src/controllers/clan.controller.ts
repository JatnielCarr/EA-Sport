import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate, requireRole, requireOwnership } from '../middleware';
import { validateRequest } from '../middleware/validate';
import { createClanSchema, updateClanSchema, clanJoinRequestSchema, clanMessageSchema, updateMemberRoleSchema, CreateClanInput, UpdateClanInput, ClanJoinRequestInput, ClanMessageInput, UpdateMemberRoleInput } from '../schemas/clan.schemas';

export async function clanController(app: FastifyInstance) {
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
      },
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
                  tag: { type: 'string' },
                  member_count: { type: 'integer' }
                }
              }
            }
          }
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
      description: 'Get clan details by ID',
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
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        }
      }
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
  // SERVER-AUTHORITATIVE: leader_id comes from JWT
  app.post('/clans', {
    preHandler: [authenticate, validateRequest({ body: createClanSchema })],
    schema: {
      tags: ['Clans'],
      description: 'Create a new clan (leader = authenticated user)',
    }
  }, async (request, reply) => {
    const userId = request.serverUser.id;
    const data = request.body as CreateClanInput;

    // Check if user already leads a clan
    const existingClan = await prisma.clan.findFirst({
      where: { leader_id: userId }
    });

    if (existingClan) {
      return reply.status(400).send({
        success: false,
        error: 'User already leads a clan'
      });
    }

    // Create clan with leader from JWT
    const clan = await prisma.clan.create({
      data: {
        ...data,
        leader_id: userId,
        members: {
          create: {
            user_id: userId,
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

  // Update clan (leader or admin only)
  app.put('/clans/:id', {
    preHandler: [
      authenticate,
      requireOwnership(async (req) => {
        const clan = await prisma.clan.findUnique({ where: { id: (req.params as any).id } });
        return clan?.leader_id ?? null;
      }),
      validateRequest({ body: updateClanSchema }),
    ],
    schema: {
      tags: ['Clans'],
      description: 'Update clan details (leader or admin only)',
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as UpdateClanInput;
    const clan = await prisma.clan.update({
      where: { id },
      data: updateData
    });
    return { success: true, data: clan };
  });

  // Delete clan (leader or admin only)
  app.delete('/clans/:id', {
    preHandler: [
      authenticate,
      requireOwnership(async (req) => {
        const clan = await prisma.clan.findUnique({ where: { id: (req.params as any).id } });
        return clan?.leader_id ?? null;
      }),
    ],
    schema: {
      tags: ['Clans'],
      description: 'Delete a clan (leader or admin only)',
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    await prisma.clan.delete({ where: { id } });
    return { success: true, message: 'Clan deleted' };
  });

  // Join clan (for OPEN clans) — user_id from JWT
  app.post('/clans/:id/join', {
    preHandler: [authenticate],
    schema: {
      tags: ['Clans'],
      description: 'Join an open clan (authenticated user)',
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // SERVER-AUTHORITATIVE: user_id from JWT, never from body
    const userId = request.serverUser.id;

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

    const existingMember = await prisma.clanMember.findUnique({
      where: { clan_id_user_id: { clan_id: id, user_id: userId } }
    });

    if (existingMember) {
      return reply.status(400).send({
        success: false,
        error: 'Already a member of this clan'
      });
    }

    const member = await prisma.clanMember.create({
      data: { clan_id: id, user_id: userId, role: 'MEMBER' },
      include: { user: { select: { id: true, username: true } } }
    });

    return { success: true, data: member };
  });

  // Request to join clan (for INVITE_ONLY clans) — user_id from JWT
  app.post('/clans/:id/request', {
    preHandler: [authenticate, validateRequest({ body: clanJoinRequestSchema })],
    schema: {
      tags: ['Clans'],
      description: 'Request to join a clan (authenticated user)',
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.serverUser.id;
    const { title, message } = request.body as ClanJoinRequestInput;

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

    const existingRequest = await prisma.clanRequest.findFirst({
      where: { clan_id: id, user_id: userId, status: 'PENDING' }
    });

    if (existingRequest) {
      return reply.status(400).send({
        success: false,
        error: 'You already have a pending request'
      });
    }

    const clanRequest = await prisma.clanRequest.create({
      data: { clan_id: id, user_id: userId, title, message },
      include: { user: { select: { id: true, username: true } } }
    });

    return { success: true, data: clanRequest };
  });

  // Get clan requests (leader/officer only)
  app.get('/clans/:id/requests', {
    preHandler: [
      authenticate,
      requireOwnership(async (req) => {
        const clan = await prisma.clan.findUnique({ where: { id: (req.params as any).id } });
        return clan?.leader_id ?? null;
      }),
    ],
    schema: {
      tags: ['Clans'],
      description: 'Get pending requests for a clan (leader or admin only)',
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

  // Approve/Reject request (leader/officer only)
  app.post('/clans/:id/requests/:requestId/:action', {
    preHandler: [
      authenticate,
      requireOwnership(async (req) => {
        const clan = await prisma.clan.findUnique({ where: { id: (req.params as any).id } });
        return clan?.leader_id ?? null;
      }),
    ],
    schema: {
      tags: ['Clans'],
      description: 'Approve or reject a join request (leader or admin only)',
    }
  }, async (request, reply) => {
    const { id, requestId, action } = request.params as {
      id: string;
      requestId: string;
      action: 'approve' | 'reject';
    };

    // Validate action param
    if (action !== 'approve' && action !== 'reject') {
      return reply.status(400).send({ success: false, error: 'Acción inválida. Use approve o reject' });
    }

    const clanRequest = await prisma.clanRequest.findUnique({
      where: { id: requestId }
    });

    if (!clanRequest || clanRequest.clan_id !== id) {
      return reply.status(404).send({ success: false, error: 'Request not found' });
    }

    if (action === 'approve') {
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

  // Leave clan / Remove member (requires auth: self or leader/admin)
  app.delete('/clans/:id/members/:userId', {
    preHandler: [authenticate],
    schema: {
      tags: ['Clans'],
      description: 'Remove a member from clan or leave clan (self, leader, or admin)',
    }
  }, async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };
    const currentUser = request.serverUser;

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

    // SERVER-AUTHORITATIVE: Only allow self-removal, leader, or ADMIN
    const isSelf = currentUser.id === userId;
    const isLeader = currentUser.id === clan.leader_id;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isSelf && !isLeader && !isAdmin) {
      return reply.status(403).send({
        success: false,
        error: 'Solo puedes salir tú mismo, o el líder/admin puede removerte'
      });
    }

    await prisma.clanMember.delete({
      where: { clan_id_user_id: { clan_id: id, user_id: userId } }
    });

    return { success: true, message: 'Member removed from clan' };
  });

  // Update member role (leader only)
  app.put('/clans/:id/members/:userId/role', {
    preHandler: [
      authenticate,
      requireOwnership(async (req) => {
        const clan = await prisma.clan.findUnique({ where: { id: (req.params as any).id } });
        return clan?.leader_id ?? null;
      }),
      validateRequest({ body: updateMemberRoleSchema }),
    ],
    schema: {
      tags: ['Clans'],
      description: 'Update member role (leader or admin only)',
    }
  }, async (request) => {
    const { id, userId } = request.params as { id: string; userId: string };
    const { role } = request.body as UpdateMemberRoleInput;

    const member = await prisma.clanMember.update({
      where: { clan_id_user_id: { clan_id: id, user_id: userId } },
      data: { role }
    });

    return { success: true, data: member };
  });

  // Get clan messages (members only)
  app.get('/clans/:id/messages', {
    preHandler: [authenticate],
    schema: {
      tags: ['Clans'],
      description: 'Get clan chat messages (members only)',
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.serverUser.id;
    const { limit = 50, before } = request.query as { limit?: number; before?: string };

    // Verify user is a member of this clan
    const membership = await prisma.clanMember.findUnique({
      where: { clan_id_user_id: { clan_id: id, user_id: userId } }
    });
    if (!membership && request.serverUser.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'Debes ser miembro del clan para ver los mensajes' });
    }

    const where: Record<string, unknown> = { clan_id: id };
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

  // Send clan message — user_id from JWT
  app.post('/clans/:id/messages', {
    preHandler: [authenticate, validateRequest({ body: clanMessageSchema })],
    schema: {
      tags: ['Clans'],
      description: 'Send a message in clan chat (members only)',
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.serverUser.id;
    const { content, is_announcement } = request.body as ClanMessageInput;

    // Verify user is a member
    const member = await prisma.clanMember.findUnique({
      where: { clan_id_user_id: { clan_id: id, user_id: userId } }
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
        user_id: userId,
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
      description: 'Get the clan a user belongs to',
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
            data: { type: 'object', nullable: true }
          }
        }
      }
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

  // =====================================================
  // MATCH RESULT SUBMISSION (Both Captains Report)
  // =====================================================

}
