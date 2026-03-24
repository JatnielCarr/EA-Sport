import { FastifyRequest, FastifyReply } from 'fastify';

type UserRole = 'USER' | 'ORGANIZER' | 'ADMIN';

/**
 * Role-Based Access Control (RBAC) Guard Factory
 * 
 * Creates a preHandler that checks if the authenticated user has
 * one of the required roles. Must be used AFTER authenticate middleware.
 * 
 * Usage:
 *   preHandler: [authenticate, requireRole('ADMIN')]
 *   preHandler: [authenticate, requireRole('ADMIN', 'ORGANIZER')]
 */
export function requireRole(...roles: UserRole[]) {
    return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user = request.serverUser;

        if (!user) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Autenticación requerida'
                }
            });
        }

        if (!roles.includes(user.role)) {
            return reply.status(403).send({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Se requiere rol: ${roles.join(' o ')}. Tu rol actual: ${user.role}`
                }
            });
        }
    };
}

/**
 * Ownership Guard Factory
 * 
 * Creates a preHandler that checks if the authenticated user owns the
 * resource being accessed. ADMIN users always pass this check.
 * 
 * The `getResourceOwnerId` function receives the request and should
 * return the owner's user ID by querying the database. Return null
 * if the resource doesn't exist.
 * 
 * Usage:
 *   preHandler: [authenticate, requireOwnership(async (req) => {
 *     const clan = await prisma.clan.findUnique({ where: { id: req.params.id } });
 *     return clan?.leader_id ?? null;
 *   })]
 */
export function requireOwnership(
    getResourceOwnerId: (request: FastifyRequest) => Promise<string | null>
) {
    return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user = request.serverUser;

        if (!user) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Autenticación requerida'
                }
            });
        }

        // ADMIN bypasses ownership checks
        if (user.role === 'ADMIN') {
            return;
        }

        const ownerId = await getResourceOwnerId(request);

        if (ownerId === null) {
            return reply.status(404).send({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Recurso no encontrado'
                }
            });
        }

        if (ownerId !== user.id) {
            return reply.status(403).send({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'No tienes permiso para modificar este recurso'
                }
            });
        }
    };
}

/**
 * Combined Role OR Ownership Guard
 * 
 * Passes if the user has one of the required roles OR owns the resource.
 * ADMIN always passes.
 * 
 * Usage:
 *   preHandler: [authenticate, requireRoleOrOwnership(
 *     ['ORGANIZER'],
 *     async (req) => tournament.organizer_id
 *   )]
 */
export function requireRoleOrOwnership(
    roles: UserRole[],
    getResourceOwnerId: (request: FastifyRequest) => Promise<string | null>
) {
    return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user = request.serverUser;

        if (!user) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Autenticación requerida'
                }
            });
        }

        // Check role first (includes ADMIN)
        if (roles.includes(user.role) || user.role === 'ADMIN') {
            return;
        }

        // Fallback to ownership check
        const ownerId = await getResourceOwnerId(request);

        if (ownerId === null) {
            return reply.status(404).send({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Recurso no encontrado'
                }
            });
        }

        if (ownerId !== user.id) {
            return reply.status(403).send({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'No tienes permiso para esta acción'
                }
            });
        }
    };
}
