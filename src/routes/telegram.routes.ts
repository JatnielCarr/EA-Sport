/**
 * Telegram Bot Routes - ApexTournament
 * Endpoints para el bot de Telegram y notificaciones
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { telegramService } from '../config/telegram';
import { prisma } from '../config/database';

interface TelegramLinkBody {
    telegramChatId: string;
}

interface SendNotificationBody {
    userId?: string;
    chatId?: string;
    title: string;
    message: string;
    link?: string;
}

interface TournamentInviteBody {
    userId?: string;
    chatId?: string;
    tournamentId: string;
}

interface TelegramWebhookBody {
    update_id: number;
    message?: {
        message_id: number;
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username?: string;
        };
        chat: {
            id: number;
            type: string;
        };
        date: number;
        text?: string;
    };
    callback_query?: {
        id: string;
        from: {
            id: number;
            username?: string;
        };
        data: string;
    };
}

export async function telegramRoutes(app: FastifyInstance) {
    /**
     * GET /telegram/status
     * Check if Telegram bot is configured and working
     */
    app.get('/telegram/status', {
        schema: {
            tags: ['Telegram'],
            description: 'Check Telegram bot status',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        configured: { type: 'boolean' },
                        botInfo: { type: 'object' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const isConfigured = telegramService.isConfigured();
        
        if (!isConfigured) {
            return { configured: false, botInfo: null };
        }

        const botInfo = await telegramService.getMe();
        return { configured: true, botInfo: botInfo.result || null };
    });

    /**
     * POST /telegram/link
     * Link user's Telegram account
     */
    app.post('/telegram/link', {
        schema: {
            tags: ['Telegram'],
            description: 'Link Telegram account to user',
            body: {
                type: 'object',
                required: ['telegramChatId'],
                properties: {
                    telegramChatId: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest<{ Body: TelegramLinkBody }>, reply: FastifyReply) => {
        try {
            // Get user from JWT (assumes auth middleware)
            const user = (request as any).user;
            if (!user) {
                return reply.status(401).send({ success: false, error: 'No autorizado' });
            }

            const { telegramChatId } = request.body;

            // Update user with Telegram chat ID
            await prisma.user.update({
                where: { id: user.id },
                data: { telegram_chat_id: telegramChatId }
            });

            // Send welcome message
            await telegramService.sendWelcome(telegramChatId, user.username);

            return { success: true, message: 'Telegram vinculado correctamente' };
        } catch (error) {
            console.error('Error linking Telegram:', error);
            return reply.status(500).send({ success: false, error: 'Error al vincular Telegram' });
        }
    });

    /**
     * POST /telegram/send-notification
     * Send notification to a user via Telegram
     */
    app.post('/telegram/send-notification', {
        schema: {
            tags: ['Telegram'],
            description: 'Send notification via Telegram',
            body: {
                type: 'object',
                required: ['title', 'message'],
                properties: {
                    userId: { type: 'string' },
                    chatId: { type: 'string' },
                    title: { type: 'string' },
                    message: { type: 'string' },
                    link: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest<{ Body: SendNotificationBody }>, reply: FastifyReply) => {
        try {
            const { userId, chatId, title, message, link } = request.body;

            let targetChatId = chatId;

            // If userId provided, get chatId from database
            if (userId && !chatId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { telegram_chat_id: true }
                });

                if (!user?.telegram_chat_id) {
                    return reply.status(400).send({ 
                        success: false, 
                        error: 'Usuario no tiene Telegram vinculado' 
                    });
                }
                targetChatId = user.telegram_chat_id;
            }

            if (!targetChatId) {
                return reply.status(400).send({ 
                    success: false, 
                    error: 'Se requiere userId o chatId' 
                });
            }

            const result = await telegramService.sendNotification(targetChatId, title, message, link);

            return { success: result.ok, result };
        } catch (error) {
            console.error('Error sending notification:', error);
            return reply.status(500).send({ success: false, error: 'Error al enviar notificación' });
        }
    });

    /**
     * POST /telegram/invite-tournament
     * Send tournament invitation via Telegram
     */
    app.post('/telegram/invite-tournament', {
        schema: {
            tags: ['Telegram'],
            description: 'Send tournament invitation via Telegram',
            body: {
                type: 'object',
                required: ['tournamentId'],
                properties: {
                    userId: { type: 'string' },
                    chatId: { type: 'string' },
                    tournamentId: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest<{ Body: TournamentInviteBody }>, reply: FastifyReply) => {
        try {
            const { userId, chatId, tournamentId } = request.body;

            // Get tournament info
            const tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                include: { game: true }
            });

            if (!tournament) {
                return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
            }

            let targetChatId = chatId;

            // If userId provided, get chatId from database
            if (userId && !chatId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { telegram_chat_id: true }
                });

                if (!user?.telegram_chat_id) {
                    return reply.status(400).send({ 
                        success: false, 
                        error: 'Usuario no tiene Telegram vinculado' 
                    });
                }
                targetChatId = user.telegram_chat_id;
            }

            if (!targetChatId) {
                return reply.status(400).send({ 
                    success: false, 
                    error: 'Se requiere userId o chatId' 
                });
            }

            // Create invite link
            const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/#/tournament/${tournamentId}`;

            const result = await telegramService.sendTournamentInvitation(
                targetChatId,
                tournament.name,
                tournament.start_date.toLocaleDateString('es-MX'),
                inviteLink,
                tournament.game?.name
            );

            return { success: result.ok, result };
        } catch (error) {
            console.error('Error sending tournament invitation:', error);
            return reply.status(500).send({ success: false, error: 'Error al enviar invitación' });
        }
    });

    /**
     * POST /telegram/notify-match
     * Notify user about upcoming match
     */
    app.post('/telegram/notify-match', {
        schema: {
            tags: ['Telegram'],
            description: 'Notify user about upcoming match'
        }
    }, async (request: FastifyRequest<{ Body: { userId: string; matchId: string } }>, reply: FastifyReply) => {
        try {
            const { userId, matchId } = request.body;

            // Get user
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { telegram_chat_id: true, username: true }
            });

            if (!user?.telegram_chat_id) {
                return reply.status(400).send({ 
                    success: false, 
                    error: 'Usuario no tiene Telegram vinculado' 
                });
            }

            // Get match info
            const match = await prisma.match.findUnique({
                where: { id: matchId },
                include: {
                    tournament: true,
                    team1: true,
                    team2: true
                }
            });

            if (!match) {
                return reply.status(404).send({ success: false, error: 'Partida no encontrada' });
            }

            const opponent = match.team1?.name || match.team2?.name || 'Por determinar';
            const matchLink = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/#/match/${matchId}`;

            const result = await telegramService.sendMatchNotification(user.telegram_chat_id, {
                tournamentName: match.tournament.name,
                opponent,
                matchTime: match.scheduled_time?.toLocaleString('es-MX') || 'Por confirmar',
                matchLink
            });

            return { success: result.ok, result };
        } catch (error) {
            console.error('Error notifying match:', error);
            return reply.status(500).send({ success: false, error: 'Error al notificar partida' });
        }
    });

    /**
     * POST /telegram/webhook
     * Webhook endpoint for receiving Telegram updates
     * This is called by Telegram when users send messages to the bot
     */
    app.post('/telegram/webhook', {
        schema: {
            tags: ['Telegram'],
            description: 'Webhook for Telegram bot updates'
        }
    }, async (request: FastifyRequest<{ Body: TelegramWebhookBody }>, reply: FastifyReply) => {
        try {
            const update = request.body;

            // Handle regular messages
            if (update.message?.text) {
                const chatId = update.message.chat.id;
                const text = update.message.text;
                const username = update.message.from.username || update.message.from.first_name;

                // Handle commands
                if (text.startsWith('/')) {
                    await handleCommand(chatId, text, username);
                }
            }

            // Handle callback queries (button clicks)
            if (update.callback_query) {
                const callbackData = update.callback_query.data;
                const chatId = update.callback_query.from.id;

                if (callbackData === 'reject_invite') {
                    await telegramService.sendMessage({
                        chatId,
                        text: '❌ Has rechazado la invitación. Puedes unirte más tarde desde la app.',
                        parseMode: 'HTML'
                    });
                }
            }

            return { ok: true };
        } catch (error) {
            console.error('Telegram webhook error:', error);
            return { ok: false };
        }
    });

    /**
     * POST /telegram/setup-webhook
     * Setup the Telegram webhook (call this once to configure)
     */
    app.post('/telegram/setup-webhook', {
        schema: {
            tags: ['Telegram'],
            description: 'Setup Telegram webhook URL'
        }
    }, async (request: FastifyRequest<{ Body: { webhookUrl: string } }>, reply: FastifyReply) => {
        try {
            const { webhookUrl } = request.body;
            const result = await telegramService.setWebhook(webhookUrl);
            return { success: result.ok, result };
        } catch (error) {
            console.error('Error setting webhook:', error);
            return reply.status(500).send({ success: false, error: 'Error al configurar webhook' });
        }
    });

    /**
     * POST /telegram/broadcast
     * Send message to all users with Telegram linked (admin only)
     */
    app.post('/telegram/broadcast', {
        schema: {
            tags: ['Telegram'],
            description: 'Broadcast message to all Telegram users'
        }
    }, async (request: FastifyRequest<{ Body: { title: string; message: string; link?: string } }>, reply: FastifyReply) => {
        try {
            const { title, message, link } = request.body;

            // Get all users with Telegram linked
            const users = await prisma.user.findMany({
                where: { 
                    telegram_chat_id: { not: null }
                },
                select: { telegram_chat_id: true }
            });

            let sent = 0;
            let failed = 0;

            for (const user of users) {
                if (user.telegram_chat_id) {
                    const result = await telegramService.sendNotification(
                        user.telegram_chat_id,
                        title,
                        message,
                        link
                    );
                    if (result.ok) sent++;
                    else failed++;

                    // Rate limit: wait 50ms between messages
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            return { 
                success: true, 
                stats: { total: users.length, sent, failed } 
            };
        } catch (error) {
            console.error('Error broadcasting:', error);
            return reply.status(500).send({ success: false, error: 'Error al enviar broadcast' });
        }
    });
}

/**
 * Handle bot commands
 */
async function handleCommand(chatId: number, command: string, username: string) {
    const cmd = command.split(' ')[0].toLowerCase();

    switch (cmd) {
        case '/start':
            await telegramService.sendMessage({
                chatId,
                text: `
🎮 <b>¡Hola ${username}!</b>

Soy el bot oficial de <b>ApexTournament</b>.

Para vincular tu cuenta, ve a la app y conecta tu Telegram desde Configuración.

<b>Comandos:</b>
/torneos - Ver torneos activos
/ayuda - Mostrar ayuda
                `.trim(),
                parseMode: 'HTML'
            });
            break;

        case '/torneos':
            const tournaments = await prisma.tournament.findMany({
                where: { status: 'REGISTRATION_OPEN' },
                take: 5,
                orderBy: { start_date: 'asc' }
            });

            if (tournaments.length === 0) {
                await telegramService.sendMessage({
                    chatId,
                    text: '😔 No hay torneos con registro abierto en este momento.',
                    parseMode: 'HTML'
                });
            } else {
                let msg = '🏆 <b>Torneos con Registro Abierto:</b>\n\n';
                tournaments.forEach((t, i) => {
                    msg += `${i + 1}. <b>${t.name}</b>\n`;
                    msg += `   📅 ${t.start_date.toLocaleDateString('es-MX')}\n`;
                    msg += `   💰 Premio: $${t.prize_pool || 0}\n\n`;
                });
                await telegramService.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
            }
            break;

        case '/ayuda':
        case '/help':
            await telegramService.sendMessage({
                chatId,
                text: `
📖 <b>Ayuda - ApexTournament Bot</b>

<b>Comandos disponibles:</b>
/start - Iniciar el bot
/torneos - Ver torneos activos
/ayuda - Mostrar esta ayuda

<b>¿Cómo vincular mi cuenta?</b>
1. Abre ApexTournament en tu navegador
2. Ve a Configuración > Notificaciones
3. Haz clic en "Conectar Telegram"
4. Sigue las instrucciones

<b>¿Dudas?</b>
Visita nuestra página de FAQ o contáctanos.
                `.trim(),
                parseMode: 'HTML'
            });
            break;

        default:
            await telegramService.sendMessage({
                chatId,
                text: '❓ Comando no reconocido. Usa /ayuda para ver los comandos disponibles.',
                parseMode: 'HTML'
            });
    }
}

export default telegramRoutes;
