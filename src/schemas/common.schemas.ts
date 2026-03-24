import { z } from 'zod';

// ======= Shared Param Schemas =======

/** Validates a CUID string ID parameter */
export const idParamSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
});

/** Validates pagination query parameters */
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Two-ID param schema (e.g., /clans/:id/members/:userId) */
export const dualIdParamSchema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
});
