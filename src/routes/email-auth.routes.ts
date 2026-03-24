import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate } from '../middleware';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { emailService } from '../services/email.service';

/**
 * Email Verification & Password Reset Routes
 */
export async function emailAuthRoutes(app: FastifyInstance) {

  // =====================================================
  // EMAIL VERIFICATION
  // =====================================================

  // Send (or resend) verification email
  app.post('/auth/send-verification', {
    preHandler: [authenticate],
    schema: { tags: ['Auth'], description: 'Send email verification link' }
  }, async (request: any, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.id } });
    if (!user) return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });

    if (user.email_verified_at) {
      return reply.status(400).send({ success: false, error: 'El email ya está verificado' });
    }

    // Generate token
    const token = crypto.randomBytes(48).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: { email_verify_token: token }
    });

    // Send email
    try {
      await emailService.sendVerificationEmail(user.email, user.username, token);
    } catch (err) {
      console.error('Email send error:', err);
    }

    return { success: true, message: 'Email de verificación enviado. Revisa tu bandeja de entrada.' };
  });

  // Verify email with token
  app.get('/auth/verify-email', {
    schema: {
      tags: ['Auth'],
      description: 'Verify email with token',
      querystring: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string' } }
      }
    }
  }, async (request: any, reply) => {
    const { token } = request.query;

    const user = await prisma.user.findFirst({
      where: { email_verify_token: token }
    });

    if (!user) {
      return reply.status(400).send({ success: false, error: 'Token inválido o expirado' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        email_verified_at: new Date(),
        email_verify_token: null
      }
    });

    return { success: true, message: 'Email verificado correctamente. ¡Ya puedes usar todas las funciones!' };
  });

  // =====================================================
  // PASSWORD RESET
  // =====================================================

  // Request password reset
  app.post('/auth/forgot-password', {
    schema: {
      tags: ['Auth'],
      description: 'Request password reset email',
      body: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } }
      }
    }
  }, async (request: any, reply) => {
    const { email } = request.body;

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: true, message: 'Si el email existe, recibirás un enlace de recuperación.' };
    }

    // Generate token
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: { user_id: user.id, used: false },
      data: { used: true }
    });

    // Create new token (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    });

    // Send email
    try {
      await emailService.sendPasswordResetEmail(user.email, user.username, rawToken);
    } catch (err) {
      console.error('Password reset email error:', err);
    }

    return { success: true, message: 'Si el email existe, recibirás un enlace de recuperación.' };
  });

  // Reset password with token
  app.post('/auth/reset-password', {
    schema: {
      tags: ['Auth'],
      description: 'Reset password using token',
      body: {
        type: 'object',
        required: ['token', 'new_password'],
        properties: {
          token: { type: 'string' },
          new_password: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (request: any, reply) => {
    const { token, new_password } = request.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token_hash: tokenHash,
        used: false,
        expires_at: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!resetToken) {
      return reply.status(400).send({ success: false, error: 'Token inválido o expirado. Solicita un nuevo enlace.' });
    }

    // Hash new password
    const hashed = await bcrypt.hash(new_password, 12);

    // Update password and mark token as used
    await Promise.all([
      prisma.user.update({
        where: { id: resetToken.user_id },
        data: { password_hash: hashed }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      }),
      // Invalidate all refresh tokens for this user
      prisma.refreshToken.updateMany({
        where: { user_id: resetToken.user_id },
        data: { revoked: true }
      })
    ]);

    return { success: true, message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  });
}
