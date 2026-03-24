import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';

/**
 * Global Input Sanitizer
 * 
 * Runs on every request to normalize and clean incoming data:
 * - Trim whitespace from all string values
 * - Normalize emails to lowercase
 * - Remove null byte characters (\0) which can cause issues with DBs
 * 
 * This is a defense-in-depth measure on top of Zod validation.
 */
export function globalSanitizer(
    request: FastifyRequest,
    _reply: FastifyReply,
    done: HookHandlerDoneFunction
): void {
    if (request.body && typeof request.body === 'object') {
        request.body = sanitizeObject(request.body as Record<string, unknown>);
    }
    done();
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            let clean = value.trim();
            // Remove null bytes
            clean = clean.replace(/\0/g, '');
            // Normalize email fields to lowercase
            if (key === 'email' || key.endsWith('_email')) {
                clean = clean.toLowerCase();
            }
            sanitized[key] = clean;
        } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => {
                if (typeof item === 'string') return item.trim().replace(/\0/g, '');
                if (item !== null && typeof item === 'object') return sanitizeObject(item as Record<string, unknown>);
                return item;
            });
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}
