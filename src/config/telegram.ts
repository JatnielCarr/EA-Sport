/**
 * Telegram Bot Configuration - ApexTournament
 * Servicio para enviar mensajes y notificaciones via Telegram
 * Con soporte conversacional y anti-spam
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

// Interfaz para respuestas conversacionales
interface ConversationalPattern {
    patterns: RegExp[];
    responses: string[];
    handler?: (chatId: number, text: string, username: string) => Promise<string | null>;
}

type CommandHandler = (chatId: number, args: string[], username: string) => Promise<void>;
type MessageHandler = (chatId: number, text: string, username: string) => Promise<void>;

class TelegramService {
    private config: TelegramConfig;
    private lastUpdateId: number = 0;
    private isPolling: boolean = false;
    private commandHandlers: Map<string, CommandHandler> = new Map();
    private defaultHandler: MessageHandler | null = null;

    // Anti-spam: Control de mensajes procesados
    private processedMessages: Set<number> = new Set();
    private messageTimestamps: Map<number, number[]> = new Map(); // chatId -> timestamps
    private readonly MAX_MESSAGES_PER_MINUTE = 10;
    private readonly PROCESSED_MESSAGES_LIMIT = 1000;

    // Sistema conversacional
    private conversationalPatterns: ConversationalPattern[] = [];

    constructor() {
        const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.config = {
            botToken,
            apiUrl: `https://api.telegram.org/bot${botToken}`
        };

        // Registrar comandos por defecto
        this.registerDefaultCommands();

        // Registrar patrones conversacionales
        this.registerConversationalPatterns();
    }

    /**
     * Verificar si un mensaje ya fue procesado (anti-duplicados)
     */
    private isMessageProcessed(messageId: number): boolean {
        if (this.processedMessages.has(messageId)) {
            return true;
        }

        // Limpiar mensajes antiguos si hay muchos
        if (this.processedMessages.size > this.PROCESSED_MESSAGES_LIMIT) {
            const toDelete = Array.from(this.processedMessages).slice(0, 500);
            toDelete.forEach(id => this.processedMessages.delete(id));
        }

        this.processedMessages.add(messageId);
        return false;
    }

    /**
     * Verificar rate limiting (anti-spam)
     */
    private isRateLimited(chatId: number): boolean {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        let timestamps = this.messageTimestamps.get(chatId) || [];

        // Filtrar timestamps del último minuto
        timestamps = timestamps.filter(t => t > oneMinuteAgo);

        if (timestamps.length >= this.MAX_MESSAGES_PER_MINUTE) {
            return true;
        }

        timestamps.push(now);
        this.messageTimestamps.set(chatId, timestamps);
        return false;
    }

    /**
     * Registrar patrones conversacionales para respuestas naturales
     */
    private registerConversationalPatterns(): void {
        this.conversationalPatterns = [
            // Saludos
            {
                patterns: [
                    /^(hola|hey|buenas|buenos d[ií]as|buenas tardes|buenas noches|saludos|hi|hello|que tal|qué tal|ey|holi)/i
                ],
                responses: [
                    '¡Hola {username}! 👋 ¿En qué puedo ayudarte hoy?\n\nPuedes preguntarme sobre torneos, rankings, partidas, o usar /ayuda para ver todos los comandos.',
                    '¡Hey {username}! 🎮 ¿Qué tal? Estoy aquí para ayudarte con todo lo relacionado a torneos y eSports.',
                    '¡Buenas {username}! 😊 ¿Necesitas información sobre algún torneo o partida?'
                ]
            },
            // Despedidas
            {
                patterns: [
                    /^(adi[oó]s|bye|chao|hasta luego|nos vemos|hasta pronto|me voy)/i
                ],
                responses: [
                    '¡Hasta luego {username}! 👋 ¡Buena suerte en tus partidas!',
                    '¡Nos vemos {username}! 🎮 ¡Que ganes todos tus torneos!',
                    '¡Chao {username}! 😊 Aquí estaré cuando me necesites.'
                ]
            },
            // Agradecimientos
            {
                patterns: [
                    /^(gracias|thanks|thx|te agradezco|muchas gracias|mil gracias)/i
                ],
                responses: [
                    '¡De nada {username}! 😊 Para eso estoy aquí.',
                    '¡Con gusto {username}! 🎮 Si necesitas algo más, no dudes en preguntar.',
                    '¡No hay de qué! 👍 ¿Hay algo más en lo que pueda ayudarte?'
                ]
            },
            // Preguntas sobre qué puede hacer
            {
                patterns: [
                    /qu[eé] (puedes|sabes|haces|eres)/i,
                    /para qu[eé] sirves/i,
                    /c[oó]mo funciona(s)?/i,
                    /qu[eé] comandos/i
                ],
                responses: [
                    '¡Soy el bot oficial de ApexTournament! 🤖\n\n<b>Puedo ayudarte con:</b>\n• 🏆 Ver torneos activos\n• 📊 Consultar rankings\n• ⚔️ Ver partidas en vivo\n• 📅 Revisar próximas partidas\n• 📈 Ver tus estadísticas\n\nUsa /ayuda para ver todos los comandos disponibles.'
                ]
            },
            // Preguntas sobre torneos
            {
                patterns: [
                    /hay (alg[uú]n )?torneo/i,
                    /torneos? (disponibles?|activos?|abiertos?)/i,
                    /donde (me registro|inscrib)/i,
                    /quiero (jugar|participar|inscribirme|registrarme)/i,
                    /c[oó]mo (participo|me uno|entro)/i
                ],
                responses: [
                    '¡Claro! 🏆 Para ver los torneos disponibles usa el comando /torneos\n\nTe mostrará todos los torneos con registro abierto y en curso.'
                ]
            },
            // Preguntas sobre ranking
            {
                patterns: [
                    /qui[eé]n (va|est[aá]) (ganando|primero)/i,
                    /(mejores|top) jugadores/i,
                    /ranking|clasificaci[oó]n|tabla/i,
                    /qui[eé]n es el mejor/i
                ],
                responses: [
                    '📊 Para ver el ranking de los mejores jugadores usa /ranking\n\n¡Ahí verás el top 10 con sus estadísticas!'
                ]
            },
            // Preguntas sobre partidas
            {
                patterns: [
                    /partidas? (en vivo|ahora|actuales?)/i,
                    /qui[eé]n (juega|est[aá] jugando) ahora/i,
                    /hay partidas?/i,
                    /qu[eé] partidas? hay/i
                ],
                responses: [
                    '⚔️ Usa /envivo para ver las partidas que se están jugando ahora mismo.\n\nO usa /proximas para ver las que vienen próximamente.'
                ]
            },
            // Mis estadísticas
            {
                patterns: [
                    /mis (stats|estad[ií]sticas|resultados)/i,
                    /c[oó]mo voy/i,
                    /cu[aá]ntas (victorias|derrotas|partidas)/i,
                    /mi (rating|puntuaci[oó]n|nivel)/i
                ],
                responses: [
                    '📈 Usa /stats para ver tus estadísticas personales.\n\n<i>Nota: Necesitas tener tu cuenta de Telegram vinculada con ApexTournament.</i>'
                ]
            },
            // Juegos disponibles
            {
                patterns: [
                    /qu[eé] juegos/i,
                    /juegos (disponibles|hay)/i,
                    /a qu[eé] (se juega|puedo jugar)/i,
                    /lista de juegos/i
                ],
                responses: [
                    '🎮 Usa /juegos para ver todos los juegos disponibles en nuestra plataforma.'
                ]
            },
            // Reglas
            {
                patterns: [
                    /reglas|normas|pol[ií]ticas/i,
                    /qu[eé] (est[aá] prohibido|no se puede)/i,
                    /c[oó]mo (funciona|son las reglas)/i
                ],
                responses: [
                    '📜 Usa /reglas para ver las reglas generales de la plataforma.\n\n¡Es importante conocerlas para evitar sanciones!'
                ]
            },
            // Problemas o ayuda
            {
                patterns: [
                    /tengo (un )?problema/i,
                    /no (funciona|puedo|me deja)/i,
                    /ayuda|help|socorro/i,
                    /necesito ayuda/i,
                    /est[aá] (mal|roto|fallando)/i
                ],
                responses: [
                    '🆘 ¡Estoy aquí para ayudarte!\n\n¿Puedes decirme más sobre tu problema?\n\nSi es un problema técnico, te recomiendo contactar a los administradores a través de la página web.',
                    '¿Qué tipo de problema tienes? 🤔\n\nCuéntame más detalles y veré cómo puedo ayudarte.\n\nTambién puedes usar /ayuda para ver todos los comandos disponibles.'
                ]
            },
            // Expresiones de frustración
            {
                patterns: [
                    /esto (no sirve|es una basura|no funciona)/i,
                    /qu[eé] (mal|asco|horror)/i,
                    /perd[ií]/i
                ],
                responses: [
                    'Entiendo tu frustración 😔 ¿Hay algo específico en lo que pueda ayudarte?\n\nSi tienes algún problema, cuéntame y veré qué puedo hacer.',
                    'A veces las cosas no salen como esperamos 😅 ¿Necesitas ayuda con algo?'
                ]
            },
            // Expresiones positivas
            {
                patterns: [
                    /gan[eé]|victoria|genial|incre[ií]ble|excelente|wow/i,
                    /qu[eé] (bien|bueno|genial)/i,
                    /lo logr[eé]/i
                ],
                responses: [
                    '¡Felicidades {username}! 🎉🏆 ¡Eso es genial!',
                    '¡Wooo! 🎊 ¡Sigue así campeón/a!',
                    '¡Excelente {username}! 💪 ¡Vas con todo!'
                ]
            },
            // Preguntas random o conversación
            {
                patterns: [
                    /c[oó]mo est[aá]s/i,
                    /qu[eé] (haces|tal|onda)/i,
                    /todo bien/i
                ],
                responses: [
                    '¡Todo bien por aquí! 🤖 Siempre listo para ayudarte con info de torneos. ¿Y tú, {username}?',
                    '¡Aquí andamos {username}! 💪 ¿Necesitas algo?',
                    '¡Excelente! Monitoreando torneos y partidas 24/7 🎮 ¿En qué te puedo ayudar?'
                ]
            },
            // Clanes
            {
                patterns: [
                    /crear (un )?(clan|equipo|team)/i,
                    /c[oó]mo (hago|hacer|creo) (un )?(clan|equipo)/i,
                    /(quiero|busco) (unirme|entrar) a un (clan|equipo)/i,
                    /qu[eé] es un (clan|equipo)/i
                ],
                responses: [
                    '👥 <b>Gestión de Clanes</b>\n\nPara crear o unirte a un clan, debes hacerlo desde nuestra plataforma web:\n\n1. Inicia sesión en ApexTournament\n2. Ve a la sección "Clanes"\n3. Ahí podrás crear tu propio equipo o unirte a uno existente.\n\n¡Reúne a tu escuadrón y compitan por la gloria!',
                    '¡Un clan es tu equipo para competir! 🛡️\n\nLa creación y administración de clanes se realiza en nuestra web. Una vez tengas tu clan, podrán inscribirse juntos a torneos de equipo.'
                ]
            }
        ];
    }

    /**
     * Procesar mensaje conversacional (no comando)
     */
    async processConversation(chatId: number, text: string, username: string): Promise<boolean> {
        const lowerText = text.toLowerCase().trim();

        // Buscar un patrón que coincida
        for (const pattern of this.conversationalPatterns) {
            for (const regex of pattern.patterns) {
                if (regex.test(lowerText)) {
                    // Si hay un handler personalizado, usarlo
                    if (pattern.handler) {
                        const response = await pattern.handler(chatId, text, username);
                        if (response) {
                            await this.sendMessage({
                                chatId,
                                text: response.replace(/{username}/g, username),
                                parseMode: 'HTML'
                            });
                            return true;
                        }
                    }

                    // Seleccionar respuesta aleatoria
                    const randomResponse = pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
                    await this.sendMessage({
                        chatId,
                        text: randomResponse.replace(/{username}/g, username),
                        parseMode: 'HTML'
                    });
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Respuesta por defecto cuando no se entiende el mensaje
     */
    async sendDefaultResponse(chatId: number, username: string): Promise<void> {
        const responses = [
            `Hmm, no estoy seguro de entender eso {username} 🤔\n\n¿Puedes reformularlo o usar uno de estos comandos?\n• /torneos - Ver torneos\n• /ranking - Ver top jugadores\n• /ayuda - Ver todos los comandos`,
            `No pillé eso {username} 😅 ¿Podrías decirlo de otra forma?\n\nO prueba con /ayuda para ver qué puedo hacer.`,
            `Mmm, eso no lo tengo muy claro 🤖 ¿Querías saber sobre torneos, rankings o partidas?\n\nUsa /ayuda para ver todas las opciones.`
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        await this.sendMessage({
            chatId,
            text: randomResponse.replace(/{username}/g, username),
            parseMode: 'HTML'
        });
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

💬 <b>¡Puedes hablarme de forma natural!</b>
Pregúntame lo que quieras sobre torneos, rankings o partidas.

<b>📋 Comandos rápidos:</b>
/torneos - Ver torneos activos
/ranking - Ver top 10 jugadores
/stats - Ver tus estadísticas
/proximas - Ver próximas partidas
/juegos - Ver juegos disponibles
/ayuda - Mostrar ayuda completa

<b>💡 Ejemplos de preguntas:</b>
• "¿Hay torneos disponibles?"
• "¿Quién va primero en el ranking?"
• "¿Qué partidas hay ahora?"

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

🤖 <b>¡Soy un bot conversacional!</b>
Puedes hablarme de forma natural o usar comandos.

<b>💬 Ejemplos de preguntas:</b>
• "¿Hay torneos disponibles?"
• "¿Quién va ganando?"
• "¿Qué juegos hay?"
• "¿Cómo me registro?"

<b>🎮 Comandos de Torneos:</b>
/torneos - Ver torneos con registro abierto
/torneo [id] - Ver detalles de un torneo

<b>📊 Comandos de Estadísticas:</b>
/ranking - Ver top 10 jugadores
/stats - Ver tus estadísticas (si vinculaste cuenta)

<b>⚔️ Comandos de Partidas:</b>
/proximas - Ver próximas partidas
/envivo - Ver partidas en vivo

<b>🛡️ Comandos de Clanes:</b>
/clanes - Ver lista de equipos
/miclan - Ver mi estatus (Líder/Miembro)

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

        // Actualizar menú de comandos en Telegram
        this.setMyCommands([
            { command: 'start', description: 'Iniciar y bienvenida' },
            { command: 'torneos', description: 'Ver torneos activos' },
            { command: 'clanes', description: 'Ver clanes registrados' },
            { command: 'miclan', description: 'Mi información de equipo' },
            { command: 'ranking', description: 'Ver top jugadores' },
            { command: 'proximas', description: 'Próximas partidas' },
            { command: 'envivo', description: 'Partidas en vivo' },
            { command: 'juegos', description: 'Juegos disponibles' },
            { command: 'ayuda', description: 'Ayuda y soporte' }
        ]).catch(err => console.error('Error setting commands:', err));
    }

    /**
     * Registrar un nuevo comando
     */
    registerCommand(command: string, handler: CommandHandler): void {
        this.commandHandlers.set(command.toLowerCase(), handler);
    }

    /**
     * Registrar un handler por defecto para mensajes no reconocidos (AI)
     */
    registerDefaultHandler(handler: MessageHandler): void {
        this.defaultHandler = handler;
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

        // Intenta enviar por n8n si está disponible
        try {
            const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/send-invitation';
            console.log('Enviando invitación vía n8n:', n8nUrl);

            const response = await fetch(n8nUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    message,
                    replyMarkup: {
                        inline_keyboard: [[
                            { text: '✅ Unirme', url: inviteLink },
                            { text: '❌ Rechazar', callback_data: 'reject_invite' }
                        ]]
                    }
                })
            });

            if (response.ok) {
                return { ok: true, result: await response.text() };
            } else {
                console.error('Error enviando a n8n:', await response.text());
                // Fallback a envío directo si falla n8n
            }
        } catch (error) {
            console.error('Error conectando con n8n:', error);
            // Fallback a envío directo
        }

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
     * Set bot commands in Telegram UI
     */
    async setMyCommands(commands: { command: string; description: string }[]): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            return { ok: false, description: 'Bot token not configured' };
        }

        try {
            const response = await fetch(`${this.config.apiUrl}/setMyCommands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commands })
            });
            return await response.json() as TelegramResponse;
        } catch (error) {
            console.error('Telegram setMyCommands error:', error);
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
            // Si no es un comando reconocido, intentar como conversación
            const handled = await this.processConversation(chatId, text.substring(1), username);
            if (!handled) {
                await this.sendDefaultResponse(chatId, username);
            }
        }
    }

    /**
     * Procesar un mensaje (comando o conversacional)
     */
    async processMessage(chatId: number, messageId: number, text: string, username: string): Promise<void> {
        // Verificar si el mensaje ya fue procesado (anti-duplicados)
        if (this.isMessageProcessed(messageId)) {
            console.log(`⚠️ Mensaje ${messageId} ya procesado, ignorando...`);
            return;
        }

        // Verificar rate limiting (anti-spam)
        if (this.isRateLimited(chatId)) {
            console.log(`⚠️ Usuario ${chatId} está enviando muchos mensajes, aplicando rate limit...`);
            // Solo notificar una vez cada cierto tiempo
            const lastWarning = this.messageTimestamps.get(chatId);
            if (lastWarning && lastWarning.length === this.MAX_MESSAGES_PER_MINUTE) {
                await this.sendMessage({
                    chatId,
                    text: '⏳ Por favor, espera un momento antes de enviar más mensajes.',
                    parseMode: 'HTML'
                });
            }
            return;
        }

        console.log(`📩 Mensaje de ${username}: ${text}`);

        // Procesar comandos
        if (text.startsWith('/')) {
            await this.processCommand(chatId, text, username);
        } else {
            // Procesar como mensaje conversacional
            const handled = await this.processConversation(chatId, text, username);
            if (!handled) {
                if (this.defaultHandler) {
                    await this.defaultHandler(chatId, text, username);
                } else {
                    await this.sendDefaultResponse(chatId, username);
                }
            }
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

        // Primero eliminar cualquier webhook existente y descartar mensajes pendientes
        console.log('🔄 Limpiando webhooks y mensajes pendientes...');
        await this.deleteWebhook();

        this.isPolling = true;
        console.log('🤖 Bot de Telegram iniciado en modo polling...');
        console.log('💬 Modo conversacional activado - El bot responde a mensajes naturales');

        // Bucle de polling
        while (this.isPolling) {
            try {
                const response = await this.getUpdates(this.lastUpdateId + 1);

                if (response.ok && response.result && response.result.length > 0) {
                    for (const update of response.result as TelegramUpdate[]) {
                        this.lastUpdateId = update.update_id;

                        if (update.message?.text && update.message?.message_id) {
                            const chatId = update.message.chat.id;
                            const messageId = update.message.message_id;
                            const text = update.message.text;
                            const username = update.message.from.username || update.message.from.first_name;

                            // Ignorar mensajes muy antiguos (más de 30 segundos)
                            const messageAge = Date.now() / 1000 - update.message.date;
                            if (messageAge > 30) {
                                console.log(`⏭️ Ignorando mensaje antiguo (${Math.round(messageAge)}s): ${text}`);
                                continue;
                            }

                            await this.processMessage(chatId, messageId, text, username);
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