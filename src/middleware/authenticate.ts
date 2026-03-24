import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';

/**
 * Server-Authoritative Authentication Middleware
 * 
 * ZERO TRUST: Never trust the JWT payload alone.
 * Always re-validate the user from the database to ensure:
 * - The user still exists
 * - The user is not banned
 * - The user's role is current (not stale from JWT)
 * 
 * Injects `request.serverUser` with fresh DB data.
 */

export interface ServerUser {
    id: string;
    email: string;
    username: string;
    role: 'USER' | 'ORGANIZER' | 'ADMIN';
    banned: boolean;
    ban_reason: string | null;
    ban_duration: string | null;
    banned_until: Date | null;
}

// Extend Fastify request type
declare module 'fastify' {
    interface FastifyRequest {
        serverUser: ServerUser;
    }
}

export async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        // Step 1: Verify JWT signature and expiration
        await request.jwtVerify();
        const tokenPayload = request.user as { id: string };

        if (!tokenPayload?.id) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Token inválido: no contiene ID de usuario'
                }
            });
        }

        // Step 2: ZERO TRUST — Load fresh user data from DB
        const user = await prisma.user.findUnique({
            where: { id: tokenPayload.id },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                banned: true,
                ban_reason: true,
                ban_duration: true,
                banned_until: true,
            }
        });

        if (!user) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'El usuario asociado a este token ya no existe'
                }
            });
        }

        // Step 3: Check ban status
        if (user.banned) {
            const now = new Date();
            if (user.ban_duration === 'permanent' || (user.banned_until && user.banned_until > now)) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'ACCOUNT_BANNED',
                        message: 'Tu cuenta está suspendida',
                        ban_info: {
                            reason: user.ban_reason || 'Violación de las reglas de la comunidad',
                            duration: user.ban_duration,
                            banned_until: user.banned_until,
                        }
                    }
                });
            } else {
                // Ban expired — auto-unban
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        banned: false,
                        ban_reason: null,
                        ban_duration: null,
                        banned_at: null,
                        banned_until: null,
                    }
                });
            }
        }

        // Step 4: Inject fresh user into request — this is the ONLY source of truth
        request.serverUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role as ServerUser['role'],
            banned: false, // If we got here, user is not banned
            ban_reason: null,
            ban_duration: null,
            banned_until: null,
        };

    } catch (err) {
        return reply.status(401).send({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Token inválido o expirado'
            }
        });
    }
}
