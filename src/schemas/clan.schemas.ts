import { z } from 'zod';

// ======= Clan Schemas =======

/** Create clan — leader_id comes from JWT */
export const createClanSchema = z.object({
    name: z.string()
        .min(3, 'El nombre del clan debe tener al menos 3 caracteres')
        .max(50, 'El nombre del clan no puede exceder 50 caracteres'),
    tag: z.string()
        .min(2, 'El tag debe tener al menos 2 caracteres')
        .max(5, 'El tag no puede exceder 5 caracteres')
        .regex(/^[A-Za-z0-9]+$/, 'El tag solo puede contener letras y números'),
    banner_url: z.string().url('URL del banner inválida').optional().or(z.literal('')),
    description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
    location: z.string().max(100).optional(),
    access_type: z.enum(['OPEN', 'INVITE_ONLY', 'CLOSED']).default('OPEN'),
    requirements: z.string().max(500).optional(),
    max_members: z.number().int().min(5).max(100).default(50),
});
export type CreateClanInput = z.infer<typeof createClanSchema>;

/** Update clan */
export const updateClanSchema = z.object({
    name: z.string().min(3).max(50).optional(),
    tag: z.string().min(2).max(5).regex(/^[A-Za-z0-9]+$/).optional(),
    banner_url: z.string().url().optional().or(z.literal('')),
    description: z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    access_type: z.enum(['OPEN', 'INVITE_ONLY', 'CLOSED']).optional(),
    requirements: z.string().max(500).optional(),
    max_members: z.number().int().min(5).max(100).optional(),
}).strict();
export type UpdateClanInput = z.infer<typeof updateClanSchema>;

/** Request to join clan — user_id comes from JWT */
export const clanJoinRequestSchema = z.object({
    title: z.string()
        .min(5, 'El título debe tener al menos 5 caracteres')
        .max(100, 'El título no puede exceder 100 caracteres'),
    message: z.string()
        .min(10, 'El mensaje debe tener al menos 10 caracteres')
        .max(500, 'El mensaje no puede exceder 500 caracteres'),
});
export type ClanJoinRequestInput = z.infer<typeof clanJoinRequestSchema>;

/** Send clan message — user_id comes from JWT */
export const clanMessageSchema = z.object({
    content: z.string()
        .min(1, 'El mensaje no puede estar vacío')
        .max(1000, 'El mensaje no puede exceder 1000 caracteres'),
    is_announcement: z.boolean().default(false),
});
export type ClanMessageInput = z.infer<typeof clanMessageSchema>;

/** Update member role */
export const updateMemberRoleSchema = z.object({
    role: z.enum(['OFFICER', 'MEMBER'], {
        errorMap: () => ({ message: 'Rol inválido. Opciones: OFFICER, MEMBER' })
    }),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

/** Clan action params (approve/reject) */
export const clanRequestActionParamsSchema = z.object({
    id: z.string().min(1),
    requestId: z.string().min(1),
    action: z.enum(['approve', 'reject']),
});

/** Clan message query params */
export const clanMessageQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    before: z.string().datetime().optional(),
});
