import { z } from 'zod';

// ======= Auth Schemas =======

export const loginSchema = z.object({
    email: z.string().email('Email inválido').toLowerCase().trim(),
    password: z.string().min(1, 'Contraseña es requerida'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    email: z.string().email('Email inválido').toLowerCase().trim(),
    username: z.string()
        .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
        .max(20, 'El nombre de usuario no puede tener más de 20 caracteres')
        .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guiones bajos'),
    password: z.string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .max(128, 'La contraseña no puede tener más de 128 caracteres'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Contraseña actual es requerida'),
    newPassword: z.string()
        .min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
        .max(128, 'La contraseña no puede tener más de 128 caracteres'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
