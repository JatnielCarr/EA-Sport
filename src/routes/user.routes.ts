
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';

export async function userRoutes(app: FastifyInstance) {
    // Get current user profile
    app.get('/users/me', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Users'],
            description: 'Get current user profile',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                username: { type: 'string' },
                                email: { type: 'string' },
                                role: { type: 'string' },
                                verified: { type: 'boolean' },
                                avatar_url: { type: 'string', nullable: true },
                                banner_url: { type: 'string', nullable: true },
                                balance: { type: 'string' },
                                created_at: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request: any, reply) => {
        const userId = request.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                verified: true,
                avatar_url: true,
                banner_url: true,
                description: true,
                name_change_count: true,
                balance: true,
                created_at: true
            }
        });

        if (!user) {
            return reply.status(404).send({ success: false, error: 'User not found' });
        }

        return { success: true, data: user };
    });

    // Update user profile
    app.put('/users/me', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['Users'],
            description: 'Update current user profile',
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string', minLength: 3, maxLength: 30 },
                    description: { type: 'string', maxLength: 500 },
                    avatar_url: { type: 'string' }, // Base64 or URL
                    banner_url: { type: 'string' }  // Base64 or URL
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
    }, async (request: any, reply) => {
        const userId = request.user.id;
        const { username, description, avatar_url, banner_url } = request.body as any;

        try {
            // Get current user data
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { username: true, name_change_count: true }
            });

            if (!currentUser) {
                return reply.status(404).send({ success: false, error: 'User not found' });
            }

            const isNameChanging = username && username !== currentUser.username;

            // Check username uniqueness if changing
            if (isNameChanging) {
                const existing = await prisma.user.findUnique({
                    where: { username }
                });
                if (existing && existing.id !== userId) {
                    return reply.status(400).send({ success: false, error: 'El nombre de usuario ya está en uso' });
                }

                // If this is not the first name change (free), require payment
                if (currentUser.name_change_count > 0) {
                    return reply.status(402).send({ 
                        success: false, 
                        error: 'El cambio de nombre requiere un pago de $50 MXN',
                        requiresPayment: true 
                    });
                }
            }

            const updateData: any = {};
            if (username) updateData.username = username;
            if (description !== undefined) updateData.description = description;
            if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
            if (banner_url !== undefined) updateData.banner_url = banner_url;
            
            // Increment name change count if name is being changed
            if (isNameChanging) {
                updateData.name_change_count = { increment: 1 };
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    verified: true,
                    avatar_url: true,
                    banner_url: true,
                    description: true,
                    name_change_count: true,
                    balance: true
                }
            });

            return { success: true, data: updatedUser };
        } catch (error) {
            console.error('Profile update error:', error);
            return reply.status(500).send({ success: false, error: 'Failed to update profile' });
        }
    });
    // Public User Profile (Detailed)
    app.get('/users/:id/profile', {
        schema: {
            tags: ['Users'],
            description: 'Get detailed public profile for a user',
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
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                username: { type: 'string' },
                                avatar_url: { type: 'string', nullable: true },
                                banner_url: { type: 'string', nullable: true },
                                verified: { type: 'boolean' },
                                role: { type: 'string' },
                                created_at: { type: 'string' },
                                subscription: {
                                    type: 'object',
                                    nullable: true,
                                    properties: {
                                        plan: { type: 'string' },
                                        status: { type: 'string' }
                                    }
                                },
                                clan: {
                                    type: 'object',
                                    nullable: true,
                                    properties: {
                                        name: { type: 'string' },
                                        tag: { type: 'string' },
                                        role: { type: 'string' },
                                        joined_at: { type: 'string' },
                                        member_count: { type: 'number' }
                                    }
                                },
                                stats: {
                                    type: 'object',
                                    properties: {
                                        rating: { type: 'number' },
                                        win_rate: { type: 'number' },
                                        matches: { type: 'number' },
                                        rank: { type: 'string', nullable: true }
                                    }
                                },
                                social_links: {
                                    type: 'object',
                                    nullable: true,
                                    properties: {
                                        telegram: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request: any, reply) => {
        const { id } = request.params;

        // Fetch user with relations
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: id },
                    { username: id }
                ]
            },
            include: {
                subscription: true,
                clan_memberships: {
                    include: {
                        clan: {
                            include: {
                                _count: {
                                    select: { members: true }
                                }
                            }
                        }
                    }
                },
                player_stats: true
            }
        });

        if (!user) {
            return reply.status(404).send({ success: false, error: 'User not found' });
        }

        // Process Clan Data (Primary/First Clan)
        let clanData = null;
        if (user.clan_memberships && user.clan_memberships.length > 0) {
            const membership = user.clan_memberships[0];
            clanData = {
                name: membership.clan.name,
                tag: membership.clan.tag,
                role: membership.role,
                joined_at: membership.joined_at.toISOString(),
                member_count: membership.clan._count.members
            };
        }

        // Aggregate Stats
        let totalMatches = 0;
        let totalWins = 0;
        let avgRating = 0;
        let statCount = 0;

        user.player_stats.forEach(stat => {
            totalMatches += stat.total_matches;
            totalWins += stat.wins;
            avgRating += stat.rating;
            statCount++;
        });

        const finalRating = statCount > 0 ? Math.round(avgRating / statCount) : 1000;
        const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

        // Construct Response using DetailedUserProfile structure
        const profileData = {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url,
            banner_url: user.banner_url,
            verified: user.verified,
            role: user.role,
            created_at: user.created_at.toISOString(),
            subscription: user.subscription ? {
                plan: user.subscription.plan,
                status: user.subscription.status
            } : null,
            clan: clanData,
            stats: {
                rating: finalRating,
                win_rate: winRate,
                matches: totalMatches,
                rank: null
            },
            social_links: {
                telegram: user.telegram_chat_id ? 'Linked' : undefined
            }
        };

        return { success: true, data: profileData };
    });
}
