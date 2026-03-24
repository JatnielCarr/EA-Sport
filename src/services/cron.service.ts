import { prisma } from '../config/database';

/**
 * =====================================================
 * CRON JOBS SERVICE — Tareas Programadas
 * =====================================================
 * 
 * Ejecuta tareas periódicas sin dependencia de librerías cron.
 * Usa setInterval nativo de Node.js.
 */

export function startCronJobs() {
  console.log('⏰ Starting cron jobs...');

  // Cada 5 minutos: limpiar tokens expirados
  setInterval(() => cleanExpiredTokens(), 5 * 60 * 1000);

  // Cada hora: cerrar registraciones expiradas
  setInterval(() => closeExpiredRegistrations(), 60 * 60 * 1000);

  // Cada hora: auto-descalificar no check-in
  setInterval(() => autoDisqualifyNoCheckIn(), 60 * 60 * 1000);

  // Cada 24 horas: limpiar notificaciones viejas
  setInterval(() => cleanOldNotifications(), 24 * 60 * 60 * 1000);

  // Cada 24 horas: desbanear usuarios con ban temporal expirado
  setInterval(() => processExpiredBans(), 24 * 60 * 60 * 1000);

  // Ejecutar una vez al start
  cleanExpiredTokens();
  closeExpiredRegistrations();
  processExpiredBans();

  console.log('✅ Cron jobs started');
}

/**
 * Limpiar refresh tokens y password reset tokens expirados
 */
async function cleanExpiredTokens() {
  try {
    const now = new Date();

    const [refreshResult, resetResult] = await Promise.all([
      prisma.refreshToken.deleteMany({
        where: { expires_at: { lt: now } }
      }),
      prisma.passwordResetToken.deleteMany({
        where: { OR: [{ expires_at: { lt: now } }, { used: true }] }
      })
    ]);

    if (refreshResult.count > 0 || resetResult.count > 0) {
      console.log(`🧹 Cleaned ${refreshResult.count} expired refresh tokens, ${resetResult.count} reset tokens`);
    }
  } catch (err) {
    console.error('Cron: cleanExpiredTokens error:', err);
  }
}

/**
 * Cerrar registraciones de torneos cuya deadline ya pasó
 */
async function closeExpiredRegistrations() {
  try {
    const result = await prisma.tournament.updateMany({
      where: {
        status: 'REGISTRATION_OPEN',
        registration_deadline: { lt: new Date() }
      },
      data: { status: 'REGISTRATION_CLOSED' }
    });

    if (result.count > 0) {
      console.log(`📋 Closed registration for ${result.count} tournaments`);
    }
  } catch (err) {
    console.error('Cron: closeExpiredRegistrations error:', err);
  }
}

/**
 * Auto-descalificar equipos que no hicieron check-in
 * (para partidas que requieren check-in y ya pasó el tiempo)
 */
async function autoDisqualifyNoCheckIn() {
  try {
    // Buscar partidas en CHECK_IN que llevan más de 15 minutos
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - 15);

    const staleMatches = await prisma.match.findMany({
      where: {
        status: 'CHECK_IN',
        updated_at: { lt: cutoff }
      },
      include: {
        checkins: true,
        home_team: true,
        away_team: true
      }
    });

    for (const match of staleMatches) {
      const homeCheckedIn = match.checkins.some(c => c.team_id === match.home_team_id);
      const awayCheckedIn = match.checkins.some(c => c.team_id === match.away_team_id);

      if (!homeCheckedIn && !awayCheckedIn) {
        // Ambos no hicieron check-in → cancelar partida
        await prisma.match.update({
          where: { id: match.id },
          data: { status: 'CANCELLED' }
        });
      } else if (homeCheckedIn && !awayCheckedIn && match.away_team_id) {
        // Away no hizo check-in → home gana por default
        await prisma.match.update({
          where: { id: match.id },
          data: { status: 'COMPLETED', winner_id: match.home_team_id, home_score: 1, away_score: 0 }
        });
      } else if (!homeCheckedIn && awayCheckedIn && match.home_team_id) {
        // Home no hizo check-in → away gana por default
        await prisma.match.update({
          where: { id: match.id },
          data: { status: 'COMPLETED', winner_id: match.away_team_id, home_score: 0, away_score: 1 }
        });
      }
    }

    if (staleMatches.length > 0) {
      console.log(`⚠️ Processed ${staleMatches.length} stale check-in matches`);
    }
  } catch (err) {
    console.error('Cron: autoDisqualifyNoCheckIn error:', err);
  }
}

/**
 * Limpiar notificaciones leídas de más de 30 días
 */
async function cleanOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: { created_at: { lt: thirtyDaysAgo }, read: true }
    });

    if (result.count > 0) {
      console.log(`🧹 Cleaned ${result.count} old notifications`);
    }
  } catch (err) {
    console.error('Cron: cleanOldNotifications error:', err);
  }
}

/**
 * Desbanear usuarios con ban temporal expirado
 */
async function processExpiredBans() {
  try {
    const result = await prisma.user.updateMany({
      where: {
        banned: true,
        banned_until: { lt: new Date(), not: null }
      },
      data: {
        banned: false,
        ban_reason: null,
        ban_duration: null,
        banned_at: null,
        banned_until: null
      }
    });

    if (result.count > 0) {
      console.log(`✅ Unbanned ${result.count} users with expired bans`);
    }
  } catch (err) {
    console.error('Cron: processExpiredBans error:', err);
  }
}
