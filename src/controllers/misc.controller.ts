import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate, requireRole } from '../middleware';

export async function miscController(app: FastifyInstance) {
  app.post('/payment/withdraw', {
    preHandler: [authenticate],
    schema: {
      tags: ['Payment'],
      description: 'Request a withdrawal from wallet balance',
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', minimum: 50 },
          method: { type: 'string', enum: ['bank_transfer', 'paypal', 'stripe'] },
          account_details: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { amount, method, account_details } = request.body as { amount: number; method?: string; account_details?: string };
    const user = (request as any).serverUser;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });

    const balance = Number(dbUser.balance);
    if (balance < amount) {
      return reply.status(400).send({
        success: false,
        error: `Saldo insuficiente. Tu saldo actual es $${balance.toFixed(2)} MXN.`
      });
    }

    if (amount < 50) {
      return reply.status(400).send({ success: false, error: 'El monto mínimo de retiro es $50 MXN.' });
    }

    // Deduct from balance and create withdrawal record
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: amount } }
    });

    const revenue = await prisma.platformRevenue.create({
      data: {
        transaction_type: 'WITHDRAWAL',
        amount: amount,
        currency: 'mxn',
        status: 'PENDING',
        description: `Retiro de $${amount} MXN - ${method || 'pendiente'} - ${account_details || 'sin detalles'}`,
        user_id: user.id
      }
    });

    return {
      success: true,
      data: revenue,
      message: `Solicitud de retiro por $${amount} MXN creada. Se procesará en 1-3 días hábiles.`
    };
  });

  // Get withdrawal requests
  app.get('/payment/withdrawals', {
    preHandler: [authenticate],
    schema: { tags: ['Payment'], description: 'Get user withdrawal history' }
  }, async (request, reply) => {
    const user = (request as any).serverUser;

    const withdrawals = await prisma.platformRevenue.findMany({
      where: {
        user_id: user.id,
        transaction_type: 'WITHDRAWAL'
      },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    return { success: true, data: withdrawals };
  });

  // =====================================================

  app.post('/game-accounts/:accountId/verify', {
    preHandler: [authenticate],
    schema: {
      tags: ['Game Accounts'],
      description: 'Initiate verification of a game account via external API (Riot, EA, Tracker.gg)',
      params: { type: 'object', properties: { accountId: { type: 'string' } } }
    }
  }, async (request, reply) => {
    const { accountId } = request.params as { accountId: string };
    const user = (request as any).serverUser;

    const account = await prisma.gameAccount.findUnique({
      where: { id: accountId },
      include: { game: true }
    });

    if (!account) return reply.status(404).send({ success: false, error: 'Cuenta de juego no encontrada' });
    if (account.user_id !== user.id && user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, error: 'No tienes permiso para verificar esta cuenta' });
    }

    const gameSlug = account.game.slug;

    // Stub verification logic — in production, call external APIs here
    // e.g., Riot API for Valorant/LoL, EA API for Apex, Tracker.gg for generic
    let verificationResult = {
      verified: false,
      rank: null as string | null,
      message: '',
      provider: '' as string,
    };

    switch (gameSlug) {
      case 'valorant':
      case 'league-of-legends':
        verificationResult = {
          verified: true,
          rank: 'Diamond',
          message: `Cuenta verificada via Riot API (stub). Account: ${account.game_username}`,
          provider: 'riot_games',
        };
        break;
      case 'apex-legends':
        verificationResult = {
          verified: true,
          rank: 'Master',
          message: `Cuenta verificada via EA API (stub). Account: ${account.game_username}`,
          provider: 'ea_api',
        };
        break;
      case 'fortnite':
        verificationResult = {
          verified: true,
          rank: 'Champion',
          message: `Cuenta verificada via Tracker.gg (stub). Account: ${account.game_username}`,
          provider: 'tracker_gg',
        };
        break;
      default:
        verificationResult = {
          verified: false,
          rank: null,
          message: `Verificación automática no disponible para ${account.game.name}. Verificación manual requerida.`,
          provider: 'manual',
        };
    }

    if (verificationResult.verified) {
      await prisma.gameAccount.update({
        where: { id: accountId },
        data: {
          verified: true,
          verified_at: new Date(),
          rank: verificationResult.rank || account.rank,
        }
      });
    }

    return {
      success: true,
      data: {
        account_id: accountId,
        game: account.game.name,
        game_username: account.game_username,
        ...verificationResult,
      },
      message: verificationResult.message

    };
  });

  // Anti-smurf check
  app.get('/game-accounts/check-smurf/:gameId/:gameUsername', {
    preHandler: [authenticate],
    schema: {
      tags: ['Game Accounts'],
      description: 'Check if a game account is potentially a smurf/multi-account',
    }
  }, async (request, reply) => {
    const { gameId, gameUsername } = request.params as { gameId: string; gameUsername: string };

    // Check if this game username is already linked to another user
    const existing = await prisma.gameAccount.findMany({
      where: {
        game_id: gameId,
        game_username: { equals: gameUsername }
      },
      include: { user: { select: { id: true, username: true } } }
    });

    if (existing.length > 1) {
      return {
        success: true,
        data: {
          is_smurf: true,
          accounts: existing.map(a => ({
            user: a.user.username,
            account_id: a.account_id,
            verified: a.verified
          })),
          message: 'Esta cuenta de juego está vinculada a múltiples usuarios.'
        }
      };
    }

    return {
      success: true,
      data: {
        is_smurf: false,
        message: 'No se detectó actividad de multicuenta.'
      }
    };
  });
}
