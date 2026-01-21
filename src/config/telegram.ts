/**
 * Telegram Bot Configuration - ApexTournament
 * Servicio para enviar mensajes y notificaciones via Telegram
 */

interface TelegramConfig {
    botToken: string;
    apiUrl: string;
}

interface SendMessageOptions {
    chatId: string | number;
    text: string;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disableWebPagePreview?: boolean;
    replyMarkup?: object;
}

interface TelegramResponse {
    ok: boolean;
    result?: any;
    description?: string;
}

class TelegramService {
    private config: TelegramConfig;

    constructor() {
        const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.config = {
            botToken,
            apiUrl: `https://api.telegram.org/bot${botToken}`
        };
    }

    /**
     * Check if Telegram is configured
     */
    isConfigured(): boolean {
        return !!this.config.botToken && this.config.botToken.length > 0;
    }

    /**
     * Send a text message
     */
    async sendMessage(options: SendMessageOptions): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            console.warn('Telegram bot token not configured');
            return { ok: false, description: 'Bot token not configured' };
        }

        try {
            const response = await fetch(`${this.config.apiUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: options.chatId,
                    text: options.text,
                    parse_mode: options.parseMode || 'HTML',
                    disable_web_page_preview: options.disableWebPagePreview || false,
                    reply_markup: options.replyMarkup
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Telegram sendMessage error:', error);
            return { ok: false, description: String(error) };
        }
    }

    /**
     * Send tournament invitation
     */
    async sendTournamentInvitation(
        chatId: string | number,
        tournamentName: string,
        tournamentDate: string,
        inviteLink: string,
        gameName?: string
    ): Promise<TelegramResponse> {
        const message = `
🏆 <b>¡Invitación a Torneo!</b>

📋 <b>Torneo:</b> ${tournamentName}
🎮 <b>Juego:</b> ${gameName || 'Varios'}
📅 <b>Fecha:</b> ${tournamentDate}

¡Has sido invitado a participar en este emocionante torneo!

🔗 <a href="${inviteLink}">Unirse al Torneo</a>

<i>No te pierdas la oportunidad de competir y ganar premios increíbles.</i>
        `.trim();

        return this.sendMessage({
            chatId,
            text: message,
            parseMode: 'HTML',
            replyMarkup: {
                inline_keyboard: [[
                    { text: '✅ Unirme', url: inviteLink },
                    { text: '❌ Rechazar', callback_data: 'reject_invite' }
                ]]
            }
        });
    }

    /**
     * Send match notification
     */
    async sendMatchNotification(
        chatId: string | number,
        matchInfo: {
            tournamentName: string;
            opponent: string;
            matchTime: string;
            matchLink?: string;
        }
    ): Promise<TelegramResponse> {
        const message = `
⚔️ <b>¡Tu partida está por comenzar!</b>

🏆 <b>Torneo:</b> ${matchInfo.tournamentName}
👤 <b>Oponente:</b> ${matchInfo.opponent}
🕐 <b>Hora:</b> ${matchInfo.matchTime}

${matchInfo.matchLink ? `🔗 <a href="${matchInfo.matchLink}">Ver Partida</a>` : ''}

<i>¡Prepárate para la batalla!</i>
        `.trim();

        return this.sendMessage({
            chatId,
            text: message,
            parseMode: 'HTML'
        });
    }

    /**
     * Send match result notification
     */
    async sendMatchResult(
        chatId: string | number,
        result: {
            tournamentName: string;
            won: boolean;
            score: string;
            nextMatch?: string;
        }
    ): Promise<TelegramResponse> {
        const emoji = result.won ? '🎉' : '😔';
        const status = result.won ? '¡VICTORIA!' : 'Derrota';

        const message = `
${emoji} <b>${status}</b>

🏆 <b>Torneo:</b> ${result.tournamentName}
📊 <b>Marcador:</b> ${result.score}
${result.nextMatch ? `\n⏭️ <b>Próxima partida:</b> ${result.nextMatch}` : ''}

${result.won ? '¡Sigue así, campeón!' : 'No te rindas, la próxima será tuya.'}
        `.trim();

        return this.sendMessage({
            chatId,
            text: message,
            parseMode: 'HTML'
        });
    }

    /**
     * Send welcome message to new user
     */
    async sendWelcome(chatId: string | number, username: string): Promise<TelegramResponse> {
        const message = `
🎮 <b>¡Bienvenido a ApexTournament, ${username}!</b>

Has vinculado tu cuenta de Telegram exitosamente. Ahora recibirás:

📩 Invitaciones a torneos
⚔️ Notificaciones de partidas
🏆 Resultados y rankings
📢 Noticias y actualizaciones

<b>Comandos disponibles:</b>
/torneos - Ver torneos activos
/misppartidas - Ver mis próximas partidas
/ranking - Ver mi posición en el ranking
/ayuda - Mostrar ayuda

¡Buena suerte en tus competencias!
        `.trim();

        return this.sendMessage({
            chatId,
            text: message,
            parseMode: 'HTML'
        });
    }

    /**
     * Send generic notification
     */
    async sendNotification(
        chatId: string | number,
        title: string,
        body: string,
        link?: string
    ): Promise<TelegramResponse> {
        let message = `📢 <b>${title}</b>\n\n${body}`;
        
        if (link) {
            message += `\n\n🔗 <a href="${link}">Ver más</a>`;
        }

        return this.sendMessage({
            chatId,
            text: message,
            parseMode: 'HTML'
        });
    }

    /**
     * Get bot info (to verify token)
     */
    async getMe(): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            return { ok: false, description: 'Bot token not configured' };
        }

        try {
            const response = await fetch(`${this.config.apiUrl}/getMe`);
            return await response.json();
        } catch (error) {
            console.error('Telegram getMe error:', error);
            return { ok: false, description: String(error) };
        }
    }

    /**
     * Set webhook for receiving updates (for n8n integration)
     */
    async setWebhook(webhookUrl: string): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            return { ok: false, description: 'Bot token not configured' };
        }

        try {
            const response = await fetch(`${this.config.apiUrl}/setWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: webhookUrl })
            });
            return await response.json();
        } catch (error) {
            console.error('Telegram setWebhook error:', error);
            return { ok: false, description: String(error) };
        }
    }
}

export const telegramService = new TelegramService();
export default telegramService;
