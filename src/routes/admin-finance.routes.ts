import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate, requireRole } from '../middleware';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';

/**
 * Admin Withdrawal Management + Refund Routes
 */
export async function adminFinanceRoutes(app: FastifyInstance) {

  // =====================================================
  // ADMIN: WITHDRAWAL MANAGEMENT
  // =====================================================

  // Get all withdrawal requests (admin)
  app.get('/admin/withdrawals', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: { tags: ['Admin'], description: 'Get all withdrawal requests' }
  }, async (request: any) => {
    const { status } = request.query as any;
    const where: any = { transaction_type: 'WITHDRAWAL' };
    if (status) where.status = status;

    const withdrawals = await prisma.platformRevenue.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50
    });

    // Enrich with user data
    const userIds = [...new Set(withdrawals.map(w => w.user_id).filter(Boolean))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, username: true, email: true, avatar_url: true, balance: true }
    });

    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const enriched = withdrawals.map(w => ({
      ...w,
      user: w.user_id ? userMap[w.user_id] : null
    }));

    const stats = {
      pending: withdrawals.filter(w => w.status === 'PENDING').length,
      completed: withdrawals.filter(w => w.status === 'COMPLETED').length,
      failed: withdrawals.filter(w => w.status === 'FAILED').length,
      totalPending: withdrawals
        .filter(w => w.status === 'PENDING')
        .reduce((sum, w) => sum + Number(w.amount), 0)
    };

    return { success: true, data: enriched, stats };
  });

  // Approve withdrawal
  app.post('/admin/withdrawals/:id/approve', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: { tags: ['Admin'], description: 'Approve a withdrawal request' }
  }, async (request: any, reply) => {
    const { id } = request.params;

    const withdrawal = await prisma.platformRevenue.findUnique({ where: { id } });
    if (!withdrawal) return reply.status(404).send({ success: false, error: 'Retiro no encontrado' });
    if (withdrawal.status !== 'PENDING') {
      return reply.status(400).send({ success: false, error: 'Este retiro ya fue procesado' });
    }

    await prisma.platformRevenue.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });

    // Notify user
    if (withdrawal.user_id) {
      await notificationService.notifyWithdrawalStatus(withdrawal.user_id, Number(withdrawal.amount), 'COMPLETED');

      const user = await prisma.user.findUnique({ where: { id: withdrawal.user_id } });
      if (user) {
        try {
          await emailService.sendWithdrawalStatusEmail(user.email, user.username, Number(withdrawal.amount), 'approved');
        } catch (e) { console.error('Email error:', e); }
      }
    }

    return { success: true, message: 'Retiro aprobado y notificación enviada.' };
  });

  // Reject withdrawal
  app.post('/admin/withdrawals/:id/reject', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      tags: ['Admin'],
      description: 'Reject a withdrawal request',
      body: {
        type: 'object',
        properties: { reason: { type: 'string' } }
      }
    }
  }, async (request: any, reply) => {
    const { id } = request.params;
    const { reason } = request.body as any;

    const withdrawal = await prisma.platformRevenue.findUnique({ where: { id } });
    if (!withdrawal) return reply.status(404).send({ success: false, error: 'Retiro no encontrado' });
    if (withdrawal.status !== 'PENDING') {
      return reply.status(400).send({ success: false, error: 'Este retiro ya fue procesado' });
    }

    // Refund balance back to user
    if (withdrawal.user_id) {
      await prisma.user.update({
        where: { id: withdrawal.user_id },
        data: { balance: { increment: Number(withdrawal.amount) } }
      });
    }

    await prisma.platformRevenue.update({
      where: { id },
      data: {
        status: 'FAILED',
        description: `${withdrawal.description} | RECHAZADO: ${reason || 'Sin razón'}`
      }
    });

    // Notify user
    if (withdrawal.user_id) {
      await notificationService.notifyWithdrawalStatus(withdrawal.user_id, Number(withdrawal.amount), 'FAILED');

      const user = await prisma.user.findUnique({ where: { id: withdrawal.user_id } });
      if (user) {
        try {
          await emailService.sendWithdrawalStatusEmail(user.email, user.username, Number(withdrawal.amount), 'rejected', reason);
        } catch (e) { console.error('Email error:', e); }
      }
    }

    return { success: true, message: 'Retiro rechazado. Saldo devuelto al usuario.' };
  });

  // =====================================================
  // REFUNDS
  // =====================================================

  // Admin: issue refund for a payment
  app.post('/admin/refund/:paymentId', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      tags: ['Admin'],
      description: 'Issue a refund for a payment',
      params: { type: 'object', properties: { paymentId: { type: 'string' } } },
      body: {
        type: 'object',
        properties: { reason: { type: 'string' } }
      }
    }
  }, async (request: any, reply) => {
    const { paymentId } = request.params;
    const { reason } = request.body as any;

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return reply.status(404).send({ success: false, error: 'Pago no encontrado' });
    if (payment.status === 'refunded') {
      return reply.status(400).send({ success: false, error: 'Este pago ya fue reembolsado' });
    }

    // Return funds to user balance
    await prisma.user.update({
      where: { id: payment.user_id },
      data: { balance: { increment: Number(payment.amount) } }
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'refunded' }
    });

    // Create revenue record
    await prisma.platformRevenue.create({
      data: {
        transaction_type: 'REFUND',
        amount: Number(payment.amount),
        status: 'COMPLETED',
        user_id: payment.user_id,
        description: `Reembolso: ${reason || 'Sin razón especificada'}`,
        metadata: { paymentId, reason }
      }
    });

    // Notify user
    await notificationService.create({
      userId: payment.user_id,
      type: 'SYSTEM',
      title: '💸 Reembolso Procesado',
      message: `Se reembolsaron $${Number(payment.amount).toFixed(2)} MXN a tu monedero.`,
      data: { paymentId, amount: Number(payment.amount) }
    });

    return { success: true, message: `Reembolso de $${Number(payment.amount).toFixed(2)} MXN procesado.` };
  });


}
