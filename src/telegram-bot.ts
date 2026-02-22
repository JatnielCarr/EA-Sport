/**
 * Telegram Bot Standalone - ApexTournament
 * Script para ejecutar el bot de Telegram con polling
 * 
 * Ejecutar con: npx ts-node src/telegram-bot.ts
 */

import 'dotenv/config';
import { telegramService } from './config/telegram';
import { prisma } from './config/database';
import { aiService } from './services/ai';

console.log('🎮 Iniciando ApexTournament Telegram Bot...');

// Verificar configuración
if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN no está configurado en .env');
    process.exit(1);
}

// Helper para obtener contexto
async function getContextForAI(): Promise<string> {
    try {
        const [tournaments, matches, games] = await Promise.all([
            prisma.tournament.findMany({
                where: { status: { in: ['REGISTRATION_OPEN', 'PUBLISHED', 'IN_PROGRESS'] } },
                take: 5,
                include: { game: true }
            }),
            prisma.match.findMany({
                where: { status: 'SCHEDULED', scheduled_datetime: { gte: new Date() } },
                take: 5,
                include: { tournament: true, home_team: true, away_team: true },
                orderBy: { scheduled_datetime: 'asc' }
            }),
            prisma.game.findMany({ take: 5 })
        ]);

        let context = "--- TORNEOS ACTIVOS ---\n";
        tournaments.forEach(t => {
            context += `- ${t.name} (${t.game.name}): ${t.status}\n`;
        });

        context += "\n--- PRÓXIMAS PARTIDAS ---\n";
        matches.forEach(m => {
            context += `- ${m.home_team?.name} vs ${m.away_team?.name} (${m.tournament.name}) el ${m.scheduled_datetime}\n`;
        });

        context += "\n--- JUEGOS DISPONIBLES ---\n";
        games.forEach(g => {
            context += `- ${g.name}\n`;
        });

        return context;
    } catch (error) {
        console.error("Error obteniendo contexto para AI:", error);
        return "No hay datos disponibles por el momento.";
    }
}

// Registrar comandos que usan la base de datos
async function registerDatabaseCommands() {
    // /torneos - Ver torneos activos
    telegramService.registerCommand('torneos', async (chatId) => {
        try {
            const tournaments = await prisma.tournament.findMany({
                where: {
                    status: { in: ['REGISTRATION_OPEN', 'PUBLISHED', 'IN_PROGRESS'] }
                },
                include: { game: true },
                take: 10,
                orderBy: { start_date: 'asc' }
            });

            if (tournaments.length === 0) {
                await telegramService.sendMessage({
                    chatId,
                    text: '😔 No hay torneos activos en este momento.\n\n<i>¡Vuelve pronto para nuevos torneos!</i>',
                    parseMode: 'HTML'
                });
                return;
            }

            let msg = '🏆 <b>Torneos Disponibles:</b>\n\n';

            for (const t of tournaments) {
                const statusEmoji = t.status === 'IN_PROGRESS' ? '🔴' :
                    t.status === 'REGISTRATION_OPEN' ? '🟢' : '🟡';
                const statusText = t.status === 'IN_PROGRESS' ? 'En Curso' :
                    t.status === 'REGISTRATION_OPEN' ? 'Registro Abierto' : 'Próximamente';

                msg += `${statusEmoji} <b>${t.name}</b>\n`;
                msg += `   🎮 ${t.game?.name || 'Varios'}\n`;
                msg += `   📅 ${t.start_date.toLocaleDateString('es-MX')}\n`;
                msg += `   💰 Premio: $${t.prize_pool || 0}\n`;
                msg += `   📊 Estado: ${statusText}\n\n`;
            }

            msg += '<i>Usa /torneo [nombre] para más detalles</i>';

            await telegramService.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
        } catch (error) {
            console.error('Error en comando /torneos:', error);
            await telegramService.sendMessage({
                chatId,
                text: '❌ Error al obtener los torneos. Intenta más tarde.',
                parseMode: 'HTML'
            });
        }
    });

    // /ranking - Ver top 10 jugadores basado en PlayerStats
    telegramService.registerCommand('ranking', async (chatId) => {
        try {
            const topStats = await prisma.playerStats.findMany({
                orderBy: { rating: 'desc' },
                take: 10,
                include: {
                    user: { select: { username: true } },
                    game: { select: { name: true } }
                }
            });

            if (topStats.length === 0) {
                await telegramService.sendMessage({
                    chatId,
                    text: '😔 No hay jugadores en el ranking todavía.',
                    parseMode: 'HTML'
                });
                return;
            }

            let msg = '🏅 <b>Top 10 Jugadores:</b>\n\n';

            const medals = ['🥇', '🥈', '🥉'];
            topStats.forEach((stat, index) => {
                const medal = medals[index] || `${index + 1}.`;
                const winRate = stat.wins + stat.losses > 0
                    ? Math.round((stat.wins / (stat.wins + stat.losses)) * 100)
                    : 0;

                msg += `${medal} <b>${stat.user.username}</b>\n`;
                msg += `    ⭐ ${stat.rating} rating | 🏆 ${stat.wins}W/${stat.losses}L (${winRate}%)\n`;
                msg += `    🎮 ${stat.game.name}\n\n`;
            });

            await telegramService.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
        } catch (error) {
            console.error('Error en comando /ranking:', error);
            await telegramService.sendMessage({
                chatId,
                text: '❌ Error al obtener el ranking. Intenta más tarde.',
                parseMode: 'HTML'
            });
        }
    });

    // /juegos - Ver juegos disponibles
    telegramService.registerCommand('juegos', async (chatId) => {
        try {
            const games = await prisma.game.findMany({
                orderBy: { name: 'asc' }
            });

            if (games.length === 0) {
                await telegramService.sendMessage({
                    chatId,
                    text: '😔 No hay juegos registrados todavía.',
                    parseMode: 'HTML'
                });
                return;
            }

            let msg = '🎮 <b>Juegos Disponibles:</b>\n\n';

            games.forEach(game => {
                msg += `• <b>${game.name}</b>\n`;
                msg += `   👥 Equipos de ${game.team_size_default} jugadores\n`;
            });

            msg += '\n<i>¡Participa en torneos de tu juego favorito!</i>';

            await telegramService.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
        } catch (error) {
            console.error('Error en comando /juegos:', error);
            await telegramService.sendMessage({
                chatId,
                text: '❌ Error al obtener los juegos. Intenta más tarde.',
                parseMode: 'HTML'
            });
        }
    });

    // /proximas - Ver próximas partidas
    telegramService.registerCommand('proximas', async (chatId) => {
        try {
            const matches = await prisma.match.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduled_datetime: { gte: new Date() }
                },
                include: {
                    tournament: true,
                    home_team: true,
                    away_team: true
                },
                take: 5,
                orderBy: { scheduled_datetime: 'asc' }
            });

            if (matches.length === 0) {
                await telegramService.sendMessage({
                    chatId,
                    text: '📅 No hay partidas programadas próximamente.',
                    parseMode: 'HTML'
                });
                return;
            }

            let msg = '⚔️ <b>Próximas Partidas:</b>\n\n';

            for (const match of matches) {
                const team1 = match.home_team?.name || 'TBD';
                const team2 = match.away_team?.name || 'TBD';
                const time = match.scheduled_datetime?.toLocaleString('es-MX', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                }) || 'Por confirmar';

                msg += `🏆 <b>${match.tournament.name}</b>\n`;
                msg += `   ${team1} 🆚 ${team2}\n`;
                msg += `   🕐 ${time}\n\n`;
            }

            await telegramService.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
        } catch (error) {
            console.error('Error en comando /proximas:', error);
            await telegramService.sendMessage({
                chatId,
                text: '❌ Error al obtener las partidas. Intenta más tarde.',
                parseMode: 'HTML'
            });
        }
    });

    // /envivo - Ver partidas en vivo
    telegramService.registerCommand('envivo', async (chatId) => {
        try {
            const matches = await prisma.match.findMany({
                where: { status: 'LIVE' },
                include: {
                    tournament: true,
                    home_team: true,
                    away_team: true
                },
                take: 10
            });

            if (matches.length === 0) {
                await telegramService.sendMessage({
                    chatId,
                    text: '📺 No hay partidas en vivo en este momento.\n\n<i>Usa /proximas para ver las próximas partidas.</i>',
                    parseMode: 'HTML'
                });
                return;
            }

            let msg = '🔴 <b>Partidas EN VIVO:</b>\n\n';

            for (const match of matches) {
                const team1 = match.home_team?.name || 'TBD';
                const team2 = match.away_team?.name || 'TBD';
                const score = `${match.home_score || 0} - ${match.away_score || 0}`;

                msg += `🏆 <b>${match.tournament.name}</b>\n`;
                msg += `   ${team1} <b>${score}</b> ${team2}\n\n`;
            }

            await telegramService.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
        } catch (error) {
            console.error('Error en comando /envivo:', error);
            await telegramService.sendMessage({
                chatId,
                text: '❌ Error al obtener las partidas. Intenta más tarde.',
                parseMode: 'HTML'
            });
        }
    });

    // /reglas - Ver reglas generales
    telegramService.registerCommand('reglas', async (chatId) => {
        await telegramService.sendMessage({
            chatId,
            text: `
📜 <b>Reglas Generales de ApexTournament</b>

<b>1. Conducta:</b>
• Respeto hacia todos los participantes
• No se tolera el acoso o comportamiento tóxico
• Fair play en todas las partidas

<b>2. Partidas:</b>
• Estar disponible 15 min antes
• Notificar ausencias con anticipación
• Reportar problemas técnicos inmediatamente

<b>3. Desconexiones:</b>
• Primera vez: oportunidad de reconexión (5 min)
• Más de una: puede resultar en descalificación

<b>4. Trampas:</b>
• Tolerancia cero hacia hacks o exploits
• Sanción: ban permanente

<b>5. Disputas:</b>
• Los administradores tienen la palabra final
• Decisiones basadas en evidencia

<i>¿Dudas? Contacta a un moderador.</i>
            `.trim(),
            parseMode: 'HTML'
        });
    });

    // /stats - Ver estadísticas del usuario (si está vinculado)
    telegramService.registerCommand('stats', async (chatId) => {
        try {
            // Buscar usuario por telegram_chat_id
            const user = await prisma.user.findFirst({
                where: {
                    telegram_chat_id: {
                        equals: chatId.toString()
                    }
                }
            });

            if (!user) {
                await telegramService.sendMessage({
                    chatId,
                    text: `
📊 <b>Estadísticas</b>

❌ Tu cuenta de Telegram no está vinculada.

<b>¿Cómo vincular?</b>
1. Abre ApexTournament en tu navegador
2. Ve a Configuración → Notificaciones
3. Conecta tu Telegram

<i>Una vez vinculado, podrás ver tus estadísticas aquí.</i>
                    `.trim(),
                    parseMode: 'HTML'
                });
                return;
            }

            // Obtener estadísticas por separado
            const playerStats = await prisma.playerStats.findMany({
                where: { user_id: user.id },
                include: { game: true }
            });

            const teamMemberships = await prisma.teamPlayer.findMany({
                where: { user_id: user.id },
                include: {
                    team: { include: { tournament: true } }
                }
            });

            // Calcular estadísticas totales
            let totalWins = 0, totalLosses = 0, totalRating = 0;
            playerStats.forEach(stat => {
                totalWins += stat.wins;
                totalLosses += stat.losses;
                totalRating = Math.max(totalRating, stat.rating);
            });

            const winRate = totalWins + totalLosses > 0
                ? Math.round((totalWins / (totalWins + totalLosses)) * 100)
                : 0;

            let statsMsg = `
📊 <b>Tus Estadísticas</b>

👤 <b>Usuario:</b> ${user.username}
⭐ <b>Rating máximo:</b> ${totalRating}

<b>📈 Récord Global:</b>
🏆 Victorias: ${totalWins}
💔 Derrotas: ${totalLosses}
📊 Win Rate: ${winRate}%

<b>🎮 Participaciones:</b> ${teamMemberships.length} equipos
            `.trim();

            // Mostrar stats por juego si hay
            if (playerStats.length > 0) {
                statsMsg += '\n\n<b>📊 Por Juego:</b>';
                playerStats.forEach(stat => {
                    const gameWinRate = stat.wins + stat.losses > 0
                        ? Math.round((stat.wins / (stat.wins + stat.losses)) * 100)
                        : 0;
                    statsMsg += `\n• ${stat.game.name}: ${stat.wins}W/${stat.losses}L (${gameWinRate}%)`;
                });
            }

            statsMsg += '\n\n<i>¡Sigue compitiendo para subir en el ranking!</i>';

            await telegramService.sendMessage({
                chatId,
                text: statsMsg,
                parseMode: 'HTML'
            });
        } catch (error) {
            console.error('Error en comando /stats:', error);
            await telegramService.sendMessage({
                chatId,
                text: '❌ Error al obtener tus estadísticas. Intenta más tarde.',
                parseMode: 'HTML'
            });
        }
    });

    // /clanes - Ver clanes registrados
    telegramService.registerCommand('clanes', async (chatId) => {
        try {
            const clans = await prisma.clan.findMany({
                take: 10,
                orderBy: { created_at: 'desc' },
                include: {
                    leader: { select: { username: true } },
                    _count: { select: { members: true } }
                }
            });

            if (clans.length === 0) {
                await telegramService.sendMessage({
                    chatId,
                    text: '😔 No hay clanes registrados todavía.\n\n<i>¡Sé el primero en crear uno desde la web!</i>',
                    parseMode: 'HTML'
                });
                return;
            }

            let msg = '🛡️ <b>Clanes Registrados:</b>\n\n';

            clans.forEach(clan => {
                msg += `🔹 <b>${clan.name}</b> [${clan.tag || ''}]\n`;
                msg += `   👑 Líder: ${clan.leader.username}\n`;
                msg += `   👥 Miembros: ${clan._count.members}\n\n`;
            });

            msg += '<i>Únete a un clan desde la plataforma web para competir.</i>';

            await telegramService.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
        } catch (error) {
            console.error('Error en comando /clanes:', error);
            await telegramService.sendMessage({
                chatId,
                text: '❌ Error al obtener los clanes. Intenta más tarde.',
                parseMode: 'HTML'
            });
        }
    });

    // /miclan - Ver información de mi clan
    telegramService.registerCommand('miclan', async (chatId) => {
        try {
            const user = await prisma.user.findFirst({
                where: { telegram_chat_id: chatId.toString() },
                include: {
                    clan_memberships: {
                        include: { clan: true }
                    }
                }
            });

            if (!user) {
                await telegramService.sendMessage({
                    chatId,
                    text: '⚠️ No has vinculado tu cuenta de Telegram.\nVe a la web para conectarla.',
                    parseMode: 'HTML'
                });
                return;
            }

            const membership = user.clan_memberships[0];

            if (!membership) {
                await telegramService.sendMessage({
                    chatId,
                    text: '❌ No perteneces a ningún clan.\n\nUsa /clanes para ver los disponibles o crea uno en la web.',
                    parseMode: 'HTML'
                });
                return;
            }

            const clan = membership.clan;

            let msg = `🛡️ <b>Mi Clan: ${clan.name}</b>\n\n`;
            msg += `🏷️ Tag: [${clan.tag || 'Sin Tag'}]\n`;
            msg += `📅 Unido: ${membership.joined_at.toLocaleDateString()}\n`;
            msg += `👮 Rol: ${membership.role}\n`;

            await telegramService.sendMessage({ chatId, text: msg, parseMode: 'HTML' });

        } catch (error) {
            console.error('Error en comando /miclan:', error);
            await telegramService.sendMessage({
                chatId,
                text: '❌ Error al obtener información de tu clan.',
                parseMode: 'HTML'
            });
        }
    });

    // AI Handler
    telegramService.registerDefaultHandler(async (chatId, text, _username) => {
        // Notificar que está escribiendo...
        await fetch(`${telegramService['config'].apiUrl}/sendChatAction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, action: 'typing' })
        }).catch(() => { });

        // Obtener contexto fresco
        const context = await getContextForAI();

        // Generar respuesta
        const response = await aiService.generateResponse(text, context);

        await telegramService.sendMessage({
            chatId,
            text: response,
            parseMode: 'Markdown' // AI suele usar Markdown standard
        });
    });

    console.log('✅ Comandos de base de datos registrados');
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando bot...');
    telegramService.stopPolling();
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    telegramService.stopPolling();
    await prisma.$disconnect();
    process.exit(0);
});

// Iniciar el bot
async function main() {
    try {
        // Conectar a la base de datos
        await prisma.$connect();
        console.log('✅ Conectado a la base de datos');

        // Registrar comandos
        await registerDatabaseCommands();

        // Iniciar polling
        await telegramService.startPolling();
    } catch (error) {
        console.error('❌ Error al iniciar el bot:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
