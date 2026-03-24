import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';

/**
 * Zod Schema Validation Middleware Factory
 * 
 * Creates a Fastify preHandler that validates request body, params,
 * and/or querystring against Zod schemas.
 * 
 * ZERO TRUST: The validated & stripped data REPLACES the original
 * request data. Any fields not in the schema are silently dropped.
 * 
 * Usage:
 *   preHandler: [authenticate, validateRequest({
 *     body: createTournamentSchema,
 *     params: idParamSchema,
 *   })]
 */

interface ValidationSchemas {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}

export function validateRequest(schemas: ValidationSchemas) {
    return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            // Validate and replace body
            if (schemas.body) {
                const parsed = schemas.body.parse(request.body);
                (request as any).body = parsed;
            }

            // Validate and replace params
            if (schemas.params) {
                const parsed = schemas.params.parse(request.params);
                (request as any).params = parsed;
            }

            // Validate and replace query
            if (schemas.query) {
                const parsed = schemas.query.parse(request.query);
                (request as any).query = parsed;
            }

        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));

                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Los datos enviados son inválidos',
                        details: formattedErrors,
                    }
                });
            }

            // Unexpected error
            return reply.status(500).send({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Error interno al validar los datos'
                }
            });
        }
    };
}
