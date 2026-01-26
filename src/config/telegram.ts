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

interface TelegramUpdate {
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
}

type CommandHandler = (chatId: number, args: string[], username: string) => Promise<void>;

class TelegramService {
    private config: TelegramConfig;
    private lastUpdateId: number = 0;
    private isPolling: boolean = false;
    private commandHandlers: Map<string, CommandHandler> = new Map();

    constructor() {
        const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.config = {
            botToken,
            apiUrl: `https://api.telegram.org/bot${botToken}`
        };
        
        // Registrar comandos por defecto
        this.registerDefaultCommands();
    }

    /**
     * Registrar comandos por defecto del bot
     */
    private registerDefaultCommands(): void {
        this.registerCommand('start', async (chatId, _args, username) => {
            await this.sendMessage({
                chatId,
                text: `
🎮 <b>¡Bienvenido a ApexTournament, ${username}!</b>

Soy tu asistente para torneos de eSports.

<b>📋 Comandos disponibles:</b>
/torneos - Ver torneos activos
/ranking - Ver top 10 jugadores
/stats - Ver tus estadísticas
/proximas - Ver próximas partidas
/juegos - Ver juegos disponibles
/ayuda - Mostrar ayuda

<i>¡Buena suerte en tus competencias!</i>
                `.trim(),
                parseMode: 'HTML'
            });
        });

        this.registerCommand('ayuda', async (chatId) => {
            await this.sendMessage({
                chatId,
                text: `
📖 <b>Ayuda - ApexTournament Bot</b>

<b>🎮 Comandos de Torneos:</b>
/torneos - Ver torneos con registro abierto
/torneo [id] - Ver detalles de un torneo

<b>📊 Comandos de Estadísticas:</b>
/ranking - Ver top 10 jugadores
/stats - Ver tus estadísticas (si vinculaste cuenta)

<b>⚔️ Comandos de Partidas:</b>
/proximas - Ver próximas partidas
/envivo - Ver partidas en vivo

<b>🎲 Otros:</b>
/juegos - Ver juegos disponibles
/reglas - Ver reglas generales

<b>💡 ¿Cómo vincular mi cuenta?</b>
Abre la app → Configuración → Conectar Telegram
                `.trim(),
                parseMode: 'HTML'
            });
        });

        this.registerCommand('help', async (chatId, args, username) => {
            // Alias para /ayuda
            const handler = this.commandHandlers.get('ayuda');
            if (handler) await handler(chatId, args, username);
        });
    }

    /**
     * Registrar un nuevo comando
     */
    registerCommand(command: string, handler: CommandHandler): void {
        this.commandHandlers.set(command.toLowerCase(), handler);
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

            return await response.json() as TelegramResponse;
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
            return await response.json() as TelegramResponse;
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
            return await response.json() as TelegramResponse;
        } catch (error) {
            console.error('Telegram setWebhook error:', error);
            return { ok: false, description: String(error) };
        }
    }

    /**
     * Eliminar webhook (necesario para usar polling)
     */
    async deleteWebhook(): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            return { ok: false, description: 'Bot token not configured' };
        }

        try {
            const response = await fetch(`${this.config.apiUrl}/deleteWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ drop_pending_updates: true })
            });
            return await response.json() as TelegramResponse;
        } catch (error) {
            console.error('Telegram deleteWebhook error:', error);
            return { ok: false, description: String(error) };
        }
    }

    /**
     * Obtener actualizaciones (para polling)
     */
    async getUpdates(offset?: number): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            return { ok: false, description: 'Bot token not configured' };
        }

        try {
            const params = new URLSearchParams();
            if (offset) params.append('offset', offset.toString());
            params.append('timeout', '30');
            params.append('allowed_updates', JSON.stringify(['message', 'callback_query']));

            const response = await fetch(`${this.config.apiUrl}/getUpdates?${params}`);
            return await response.json() as TelegramResponse;
        } catch (error) {
            console.error('Telegram getUpdates error:', error);
            return { ok: false, description: String(error) };
        }
    }

    /**
     * Procesar un comando
     */
    async processCommand(chatId: number, text: string, username: string): Promise<void> {
        const parts = text.split(' ');
        const command = parts[0].replace('/', '').replace('@GameApexAiBot', '').toLowerCase();
        const args = parts.slice(1);

        const handler = this.commandHandlers.get(command);
        if (handler) {
            await handler(chatId, args, username);
        } else {
            await this.sendMessage({
                chatId,
                text: '❓ Comando no reconocido. Usa /ayuda para ver los comandos disponibles.',
                parseMode: 'HTML'
            });
        }
    }

    /**
     * Iniciar polling para recibir mensajes
     */
    async startPolling(): Promise<void> {
        if (this.isPolling) {
            console.log('Polling ya está activo');
            return;
        }

        if (!this.isConfigured()) {
            console.error('❌ No se puede iniciar polling: token no configurado');
            return;
        }

        // Primero eliminar cualquier webhook existente
        await this.deleteWebhook();

        this.isPolling = true;
        console.log('🤖 Bot de Telegram iniciado en modo polling...');

        // Bucle de polling
        while (this.isPolling) {
            try {
                const response = await this.getUpdates(this.lastUpdateId + 1);

                if (response.ok && response.result && response.result.length > 0) {
                    for (const update of response.result as TelegramUpdate[]) {
                        this.lastUpdateId = update.update_id;

                        if (update.message?.text) {
                            const chatId = update.message.chat.id;
                            const text = update.message.text;
                            const username = update.message.from.username || update.message.from.first_name;

                            console.log(`📩 Mensaje de ${username}: ${text}`);

                            if (text.startsWith('/')) {
                                await this.processCommand(chatId, text, username);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error en polling:', error);
                // Esperar un poco antes de reintentar
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    /**
     * Detener polling
     */
    stopPolling(): void {
        this.isPolling = false;
        console.log('🛑 Bot de Telegram detenido');
    }
}

export const telegramService = new TelegramService();
export default telegramService;
