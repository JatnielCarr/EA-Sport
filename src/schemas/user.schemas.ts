import { z } from 'zod';

// ======= User Management Schemas =======
// These are for ADMIN operations on users, not self-service

/** Admin: create a new user */
export const createUserSchema = z.object({
    email: z.string().email('Email inválido').toLowerCase().trim(),
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    password: z.string().min(6).max(128),
    role: z.enum(['USER', 'ORGANIZER', 'ADMIN']).default('USER'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Admin: update user fields */
export const updateUserSchema = z.object({
    email: z.string().email().toLowerCase().trim().optional(),
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
    role: z.enum(['USER', 'ORGANIZER', 'ADMIN']).optional(),
}).strict(); // No extra fields allowed
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Admin: ban a user */
export const banUserSchema = z.object({
    duration: z.enum(['3d', '7d', '14d', '31d', 'permanent'], {
        errorMap: () => ({ message: 'Duración inválida. Opciones: 3d, 7d, 14d, 31d, permanent' })
    }),
    reason: z.string()
        .min(1, 'Se requiere una razón para el ban')
        .max(500, 'La razón no puede exceder 500 caracteres'),
});
export type BanUserInput = z.infer<typeof banUserSchema>;

/** Link game account — user_id comes from JWT */
export const createGameAccountSchema = z.object({
    game_id: z.string().min(1, 'game_id es requerido'),
    game_username: z.string().min(1, 'Nombre de usuario del juego es requerido').max(100),
    account_id: z.string().min(1, 'ID de la cuenta del juego es requerido').max(200),
    rank: z.string().max(50).optional(),
});
export type CreateGameAccountInput = z.infer<typeof createGameAccountSchema>;
