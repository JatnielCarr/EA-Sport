import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate } from '../middleware';

/**
 * =====================================================
 * MERCADO DE AGENTES LIBRES (Free Agent Market)
 * =====================================================
 * Jugadores sin equipo publican su perfil como "agente libre".
 * Capitanes de equipo pueden buscarlos e invitarlos.
 * =====================================================
 */

export async function freeAgentController(app: FastifyInstance) {

    // =====================================================
    // 1. PUBLICAR PERFIL COMO AGENTE LIBRE
    // =====================================================
    app.post('/free-agents', {
        preHandler: [authenticate],
        schema: {
            tags: ['Free Agent Market'],
            description: 'Publicar tu perfil como agente libre buscando equipo',
            body: {
                type: 'object',
                required: ['game_id'],
                properties: {
                    game_id: { type: 'string' },
                    bio: { type: 'string', maxLength: 1000 },
                    rank: { type: 'string' },
                    preferred_role: { type: 'string' },
                    availability: { type: 'string', enum: ['weekdays', 'weekends', 'anytime'] },
                    highlight_url: { type: 'string' },
                    looking_for: { type: 'string', enum: ['competitive', 'casual'] }
                }
            }
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;
        const body = request.body as any;

        // Verify game exists
        const game = await prisma.game.findUnique({ where: { id: body.game_id } });
        if (!game) {
            return reply.status(404).send({ success: false, error: 'Juego no encontrado' });
        }

        // Check if already has a profile
        const existing = await prisma.freeAgent.findUnique({ where: { user_id: user.id } });
        if (existing) {
            return reply.status(400).send({
                success: false,
                error: 'Ya tienes un perfil de agente libre. Usa PUT para actualizarlo.'
            });
        }

        const freeAgent = await prisma.freeAgent.create({
            data: {
                user_id: user.id,
                game_id: body.game_id,
                bio: body.bio || null,
                rank: body.rank || null,
                preferred_role: body.preferred_role || null,
                availability: body.availability || 'anytime',
                highlight_url: body.highlight_url || null,
                looking_for: body.looking_for || 'competitive'
            },
            include: {
                user: { select: { id: true, username: true, avatar_url: true } },
                game: { select: { id: true, name: true, slug: true, icon_url: true } }
            }
        });

        return { success: true, data: freeAgent, message: '¡Tu perfil de agente libre ha sido publicado!' };
    });

    // =====================================================
    // 2. LISTAR AGENTES LIBRES (con filtros)
    // =====================================================
    app.get('/free-agents', {
        schema: {
            tags: ['Free Agent Market'],
            description: 'Listar agentes libres con filtros opcionales'
        }
    }, async (request, reply) => {
        const query = request.query as {
            game_id?: string;
            rank?: string;
            preferred_role?: string;
            looking_for?: string;
            availability?: string;
            limit?: string;
            offset?: string;
        };

        const where: any = { is_active: true };
        if (query.game_id) where.game_id = query.game_id;
        if (query.rank) where.rank = query.rank;
        if (query.preferred_role) where.preferred_role = { contains: query.preferred_role };
        if (query.looking_for) where.looking_for = query.looking_for;
        if (query.availability) where.availability = query.availability;

        const limit = parseInt(query.limit || '20');
        const offset = parseInt(query.offset || '0');

        const [agents, total] = await Promise.all([
            prisma.freeAgent.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar_url: true,
                            player_stats: {
                                select: { total_matches: true, wins: true, win_rate: true, rating: true },
                                take: 3
                            }
                        }
                    },
                    game: { select: { id: true, name: true, slug: true, icon_url: true } }
                },
                orderBy: { created_at: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.freeAgent.count({ where })
        ]);

        return { success: true, data: { agents, total, limit, offset } };
    });

    // =====================================================
    // 3. VER PERFIL DE UN AGENTE LIBRE
    // =====================================================
    app.get('/free-agents/:id', {
        schema: {
            tags: ['Free Agent Market'],
            description: 'Ver perfil completo de un agente libre',
            params: { type: 'object', properties: { id: { type: 'string' } } }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const agent = await prisma.freeAgent.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                        banner_url: true,
                        description: true,
                        created_at: true,
                        player_stats: {
                            include: { game: { select: { name: true } } }
                        }
                    }
                },
                game: { select: { id: true, name: true, slug: true, icon_url: true } }
            }
        });

        if (!agent) {
            return reply.status(404).send({ success: false, error: 'Agente libre no encontrado' });
        }

        // Get reputation too
        const reputation = await prisma.playerReputation.findUnique({
            where: { user_id: agent.user_id }
        });

        return {
            success: true,
            data: {
                ...agent,
                reputation: reputation || { sportsmanship_score: 5.0, communication_score: 5.0, total_reviews: 0 }
            }
        };
    });

    // =====================================================
    // 4. ACTUALIZAR PERFIL DE AGENTE LIBRE
    // =====================================================
    app.put('/free-agents/:id', {
        preHandler: [authenticate],
        schema: {
            tags: ['Free Agent Market'],
            description: 'Actualizar tu perfil de agente libre',
            params: { type: 'object', properties: { id: { type: 'string' } } },
            body: {
                type: 'object',
                properties: {
                    bio: { type: 'string', maxLength: 1000 },
                    rank: { type: 'string' },
                    preferred_role: { type: 'string' },
                    availability: { type: 'string', enum: ['weekdays', 'weekends', 'anytime'] },
                    highlight_url: { type: 'string' },
                    looking_for: { type: 'string', enum: ['competitive', 'casual'] },
                    is_active: { type: 'boolean' }
                }
            }
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;
        const { id } = request.params as { id: string };
        const body = request.body as any;

        const agent = await prisma.freeAgent.findUnique({ where: { id } });
        if (!agent) return reply.status(404).send({ success: false, error: 'Perfil no encontrado' });
        if (agent.user_id !== user.id && user.role !== 'ADMIN') {
            return reply.status(403).send({ success: false, error: 'Solo puedes editar tu propio perfil' });
        }

        const updated = await prisma.freeAgent.update({
            where: { id },
            data: {
                ...(body.bio !== undefined && { bio: body.bio }),
                ...(body.rank !== undefined && { rank: body.rank }),
                ...(body.preferred_role !== undefined && { preferred_role: body.preferred_role }),
                ...(body.availability !== undefined && { availability: body.availability }),
                ...(body.highlight_url !== undefined && { highlight_url: body.highlight_url }),
                ...(body.looking_for !== undefined && { looking_for: body.looking_for }),
                ...(body.is_active !== undefined && { is_active: body.is_active })
            },
            include: {
                user: { select: { id: true, username: true } },
                game: { select: { id: true, name: true } }
            }
        });

        return { success: true, data: updated };
    });

    // =====================================================
    // 5. DESACTIVAR PERFIL
    // =====================================================
    app.delete('/free-agents/:id', {
        preHandler: [authenticate],
        schema: {
            tags: ['Free Agent Market'],
            description: 'Desactivar tu perfil de agente libre',
            params: { type: 'object', properties: { id: { type: 'string' } } }
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;
        const { id } = request.params as { id: string };

        const agent = await prisma.freeAgent.findUnique({ where: { id } });
        if (!agent) return reply.status(404).send({ success: false, error: 'Perfil no encontrado' });
        if (agent.user_id !== user.id && user.role !== 'ADMIN') {
            return reply.status(403).send({ success: false, error: 'Solo puedes desactivar tu propio perfil' });
        }

        await prisma.freeAgent.update({
            where: { id },
            data: { is_active: false }
        });

        return { success: true, message: 'Perfil de agente libre desactivado' };
    });

    // =====================================================
    // 6. INVITAR AGENTE LIBRE A UN EQUIPO
    // =====================================================
    app.post('/free-agents/:id/invite', {
        preHandler: [authenticate],
        schema: {
            tags: ['Free Agent Market'],
            description: 'Invitar a un agente libre a unirse a tu equipo (requiere ser capitán)',
            params: { type: 'object', properties: { id: { type: 'string' } } },
            body: {
                type: 'object',
                required: ['team_id'],
                properties: {
                    team_id: { type: 'string' },
                    message: { type: 'string', maxLength: 500 }
                }
            }
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;
        const { id } = request.params as { id: string };
        const { team_id, message } = request.body as { team_id: string; message?: string };

        // Verify free agent exists and is active
        const agent = await prisma.freeAgent.findUnique({ where: { id } });
        if (!agent || !agent.is_active) {
            return reply.status(404).send({ success: false, error: 'Agente libre no encontrado o inactivo' });
        }

        // Verify user is captain of the team
        const team = await prisma.team.findUnique({ where: { id: team_id } });
        if (!team) return reply.status(404).send({ success: false, error: 'Equipo no encontrado' });
        if (team.captain_id !== user.id && user.role !== 'ADMIN') {
            return reply.status(403).send({ success: false, error: 'Solo el capitán del equipo puede enviar invitaciones' });
        }

        // Check for existing invite
        const existingInvite = await prisma.freeAgentInvite.findUnique({
            where: { free_agent_id_team_id: { free_agent_id: id, team_id } }
        });
        if (existingInvite) {
            return reply.status(400).send({ success: false, error: 'Ya enviaste una invitación a este jugador' });
        }

        const invite = await prisma.freeAgentInvite.create({
            data: {
                free_agent_id: id,
                team_id,
                invited_by_user_id: user.id,
                message: message || null
            },
            include: {
                team: { select: { name: true, tag: true } },
                free_agent: {
                    include: { user: { select: { username: true } } }
                }
            }
        });

        return {
            success: true,
            data: invite,
            message: `Invitación enviada a ${invite.free_agent.user.username} para el equipo ${invite.team.name}`
        };
    });

    // =====================================================
    // 7. VER MIS INVITACIONES RECIBIDAS
    // =====================================================
    app.get('/free-agents/invites/my', {
        preHandler: [authenticate],
        schema: {
            tags: ['Free Agent Market'],
            description: 'Ver las invitaciones que he recibido como agente libre'
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;

        const myProfile = await prisma.freeAgent.findUnique({ where: { user_id: user.id } });
        if (!myProfile) {
            return { success: true, data: [], message: 'No tienes perfil de agente libre' };
        }

        const invites = await prisma.freeAgentInvite.findMany({
            where: { free_agent_id: myProfile.id },
            include: {
                team: {
                    select: {
                        id: true, name: true, tag: true, logo_url: true,
                        tournament: { select: { name: true, start_date: true } },
                        captain: { select: { username: true } }
                    }
                },
                invited_by: { select: { id: true, username: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        return { success: true, data: invites };
    });

    // =====================================================
    // 8. ACEPTAR O RECHAZAR INVITACIÓN
    // =====================================================
    app.patch('/free-agents/invites/:inviteId', {
        preHandler: [authenticate],
        schema: {
            tags: ['Free Agent Market'],
            description: 'Aceptar o rechazar una invitación de equipo',
            params: { type: 'object', properties: { inviteId: { type: 'string' } } },
            body: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['ACCEPTED', 'REJECTED'] }
                }
            }
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;
        const { inviteId } = request.params as { inviteId: string };
        const { status } = request.body as { status: 'ACCEPTED' | 'REJECTED' };

        const invite = await prisma.freeAgentInvite.findUnique({
            where: { id: inviteId },
            include: {
                free_agent: true,
                team: true
            }
        });

        if (!invite) {
            return reply.status(404).send({ success: false, error: 'Invitación no encontrada' });
        }

        // Verify the user owns this free agent profile
        if (invite.free_agent.user_id !== user.id) {
            return reply.status(403).send({ success: false, error: 'Esta invitación no te pertenece' });
        }

        if (invite.status !== 'PENDING') {
            return reply.status(400).send({ success: false, error: 'Esta invitación ya fue procesada' });
        }

        // Update invite status
        await prisma.freeAgentInvite.update({
            where: { id: inviteId },
            data: { status: status as any }
        });

        // If accepted, add player to the team
        if (status === 'ACCEPTED') {
            // Check if already in team
            const alreadyInTeam = await prisma.teamPlayer.findUnique({
                where: { team_id_user_id: { team_id: invite.team_id, user_id: user.id } }
            });

            if (!alreadyInTeam) {
                await prisma.teamPlayer.create({
                    data: {
                        team_id: invite.team_id,
                        user_id: user.id,
                        is_captain: false,
                        is_substitute: false
                    }
                });
            }

            // Deactivate free agent profile since they found a team
            await prisma.freeAgent.update({
                where: { id: invite.free_agent_id },
                data: { is_active: false }
            });

            return {
                success: true,
                message: `¡Te has unido al equipo ${invite.team.name}! Tu perfil de agente libre ha sido desactivado.`
            };
        }

        return { success: true, message: 'Invitación rechazada' };
    });
}
