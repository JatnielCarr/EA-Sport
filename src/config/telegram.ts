/**
 * Telegram Bot Configuration - ApexTournament
 * Servicio para enviar mensajes y notificaciones via Telegram
 * Con soporte conversacional, IA integrada y anti-spam
 */

import { AIService } from '../services/ai';
import { prisma } from './database';

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
    // @ts-ignore - kept for future extension
    private defaultHandler: MessageHandler | null = null;

    // Anti-spam: Control de mensajes procesados
    private processedMessages: Set<number> = new Set();
    private messageTimestamps: Map<number, number[]> = new Map(); // chatId -> timestamps
    private readonly MAX_MESSAGES_PER_MINUTE = 10;
    private readonly PROCESSED_MESSAGES_LIMIT = 1000;

    // Sistema conversacional
    private conversationalPatterns: ConversationalPattern[] = [];

    // AI Service para respuestas inteligentes
    private aiService: AIService | null = null;

    // Historial de conversación por chat (últimos N mensajes)
    private conversationHistory: Map<number, { role: string; text: string; timestamp: number }[]> = new Map();
    private readonly MAX_HISTORY_PER_CHAT = 10;
    private readonly HISTORY_TTL_MS = 30 * 60 * 1000; // 30 minutos

    // Retry config for transient network errors
    private readonly RETRY_ATTEMPTS = 5;
    private readonly RETRY_DELAY_MS = 2000;

    constructor() {
        const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.config = {
            botToken,
            apiUrl: `https://api.telegram.org/bot${botToken}`
        };

        // Inicializar servicio de IA
        try {
            this.aiService = new AIService();
            console.log('🤖 Telegram Bot: IA integrada activada');
        } catch (error) {
            console.warn('⚠️ Telegram Bot: IA no disponible, solo patrones conversacionales');
            this.aiService = null;
        }

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

    // ========================================================
    // Utilidades de fuzzy matching para tolerancia a errores
    // ========================================================

    /**
     * Distancia de Levenshtein entre dos strings
     */
    private levenshtein(a: string, b: string): number {
        const matrix: number[][] = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = a[j - 1] === b[i - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        return matrix[b.length][a.length];
    }

    /**
     * Normalizar texto: quitar acentos, caracteres especiales
     */
    private normalize(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // quitar acentos
            .replace(/[^a-z0-9\s]/g, '') // solo alfanuméricos
            .trim();
    }

    /**
     * Verificar si una palabra fuzzy-matchea con alguna keyword
     */
    private fuzzyMatch(input: string, keywords: string[], threshold = 0.35): boolean {
        const normalizedInput = this.normalize(input);
        const words = normalizedInput.split(/\s+/);

        for (const keyword of keywords) {
            const normalizedKeyword = this.normalize(keyword);

            // Match exacto en el input completo
            if (normalizedInput.includes(normalizedKeyword)) return true;

            // Fuzzy match por palabra
            for (const word of words) {
                if (word.length < 3) continue; // ignorar palabras muy cortas
                const distance = this.levenshtein(word, normalizedKeyword);
                const maxLen = Math.max(word.length, normalizedKeyword.length);
                const similarity = 1 - distance / maxLen;
                if (similarity >= (1 - threshold)) return true;
            }
        }
        return false;
    }

    /**
     * Mapa de intenciones fuzzy → handlers
     */
    private fuzzyIntents: { keywords: string[]; handler: (chatId: number, username: string) => Promise<void> }[] = [];

    /**
     * Registrar intenciones fuzzy
     */
    private registerFuzzyIntents(): void {
        this.fuzzyIntents = [
            {
                keywords: ['hola', 'hello', 'hey', 'buenas', 'saludos', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'holi'],
                handler: async (chatId, username) => {
                    const responses = [
                        `¡Hola ${username}! 👋 ¿En qué puedo ayudarte?`,
                        `¡Hey ${username}! 🎮 ¿Qué tal? Pregúntame lo que quieras.`,
                        `¡Buenas ${username}! 😊 Estoy aquí para ayudarte.`
                    ];
                    await this.sendMessage({ chatId, text: responses[Math.floor(Math.random() * responses.length)], parseMode: 'HTML' });
                }
            },
            {
                keywords: ['adios', 'bye', 'chao', 'hasta luego', 'nos vemos', 'me voy'],
                handler: async (chatId, username) => {
                    await this.sendMessage({ chatId, text: `¡Hasta luego ${username}! 👋 ¡Buena suerte en tus partidas!`, parseMode: 'HTML' });
                }
            },
            {
                keywords: ['gracias', 'thanks', 'grax', 'grasias', 'garcias'],
                handler: async (chatId, username) => {
                    await this.sendMessage({ chatId, text: `¡De nada ${username}! 😊 Si necesitas algo más, pregúntame.`, parseMode: 'HTML' });
                }
            },
            {
                keywords: ['torneo', 'torneos', 'campeonato', 'competencia', 'competicion', 'participar', 'inscribirme', 'registrarme'],
                handler: async (chatId, _username) => {
                    // Consultar torneos reales de la BD
                    try {
                        const tournaments = await prisma.tournament.findMany({
                            where: { status: { in: ['REGISTRATION_OPEN', 'IN_PROGRESS', 'PUBLISHED'] } },
                            include: { game: { select: { name: true } } },
                            orderBy: { start_date: 'asc' },
                            take: 5
                        });

                        if (tournaments.length === 0) {
                            await this.sendMessage({ chatId, text: '😔 No hay torneos activos en este momento. ¡Vuelve pronto!', parseMode: 'HTML' });
                            return;
                        }

                        let msg = '🏆 <b>Torneos Disponibles:</b>\n\n';
                        for (const t of tournaments) {
                            const emoji = t.status === 'IN_PROGRESS' ? '🔴' : '🟢';
                            const st = t.status === 'IN_PROGRESS' ? 'En Curso' : 'Registro Abierto';
                            msg += `${emoji} <b>${t.name}</b>\n   🎮 ${(t.game as any)?.name || 'Varios'} | 💰 $${t.prize_pool || 0} | ${st}\n\n`;
                        }
                        await this.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
                    } catch {
                        await this.sendMessage({ chatId, text: '🏆 Usa /torneos para ver los torneos disponibles.', parseMode: 'HTML' });
                    }
                }
            },
            {
                keywords: ['ranking', 'clasificacion', 'mejores jugadores', 'top', 'primero', 'ganando'],
                handler: async (chatId, _username) => {
                    try {
                        const stats = await prisma.playerStats.findMany({
                            include: { user: { select: { username: true } }, game: { select: { name: true } } },
                            orderBy: { rating: 'desc' },
                            take: 10
                        });

                        if (stats.length === 0) {
                            await this.sendMessage({ chatId, text: '😔 No hay datos de ranking aún.', parseMode: 'HTML' });
                            return;
                        }

                        const medals = ['🥇', '🥈', '🥉'];
                        let msg = '🏅 <b>Top 10 Jugadores:</b>\n\n';
                        stats.forEach((s, i) => {
                            const m = medals[i] || `${i + 1}.`;
                            const wr = (s.wins + s.losses) > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0;
                            msg += `${m} <b>${s.user.username}</b> ⭐${s.rating} | ${s.wins}W/${s.losses}L (${wr}%)\n`;
                        });
                        await this.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
                    } catch {
                        await this.sendMessage({ chatId, text: '📊 Usa /ranking para ver el top 10.', parseMode: 'HTML' });
                    }
                }
            },
            {
                keywords: ['partida', 'partidas', 'en vivo', 'envivo', 'jugando', 'ahora'],
                handler: async (chatId, _username) => {
                    await this.sendMessage({ chatId, text: '⚔️ Usa /envivo para partidas en vivo o /proximas para las próximas.', parseMode: 'HTML' });
                }
            },
            {
                keywords: ['estadisticas', 'stats', 'mis datos', 'mi rating', 'como voy'],
                handler: async (chatId, _username) => {
                    await this.sendMessage({ chatId, text: '📈 Usa /stats para ver tus estadísticas personales.\n\n<i>Necesitas tener tu cuenta vinculada.</i>', parseMode: 'HTML' });
                }
            },
            {
                keywords: ['juego', 'juegos', 'que juegos', 'juegos disponibles'],
                handler: async (chatId, _username) => {
                    try {
                        const games = await prisma.game.findMany({ orderBy: { name: 'asc' } });
                        if (games.length === 0) {
                            await this.sendMessage({ chatId, text: '😔 No hay juegos registrados.', parseMode: 'HTML' });
                            return;
                        }
                        let msg = '🎮 <b>Juegos Disponibles:</b>\n\n';
                        games.forEach(g => { msg += `• <b>${g.name}</b> (${g.team_size_default} jugadores)\n`; });
                        await this.sendMessage({ chatId, text: msg, parseMode: 'HTML' });
                    } catch {
                        await this.sendMessage({ chatId, text: '🎮 Usa /juegos para ver los juegos disponibles.', parseMode: 'HTML' });
                    }
                }
            },
            {
                keywords: ['clan', 'clanes', 'equipo', 'team', 'mi clan'],
                handler: async (chatId, _username) => {
                    await this.sendMessage({ chatId, text: '👥 Usa /clanes para ver los equipos o /miclan para tu clan.\n\nLa gestión de clanes se hace desde la web.', parseMode: 'HTML' });
                }
            },
            {
                keywords: ['reglas', 'normas', 'politicas', 'prohibido'],
                handler: async (chatId, _username) => {
                    await this.sendMessage({ chatId, text: '📜 Usa /reglas para ver las reglas generales.', parseMode: 'HTML' });
                }
            },
            {
                keywords: ['ayuda', 'help', 'comandos', 'que puedo', 'como funciona'],
                handler: async (chatId, _username) => {
                    const handler = this.commandHandlers.get('ayuda');
                    if (handler) await handler(chatId, [], _username);
                }
            },
            {
                keywords: ['problema', 'error', 'no funciona', 'falla', 'bug', 'roto'],
                handler: async (chatId, _username) => {
                    await this.sendMessage({ chatId, text: '🆘 ¿Puedes decirme más sobre tu problema?\nSi es técnico, contacta a los administradores en la web.', parseMode: 'HTML' });
                }
            }
        ];
    }

    /**
     * Procesar mensaje conversacional (no comando)
     * Primero intenta regex, luego fuzzy matching, luego IA
     */
    async processConversation(chatId: number, text: string, username: string): Promise<boolean> {
        const lowerText = text.toLowerCase().trim();

        // 1. Buscar un patrón regex que coincida (rápido)
        for (const pattern of this.conversationalPatterns) {
            for (const regex of pattern.patterns) {
                if (regex.test(lowerText)) {
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

        // 2. Fuzzy matching (tolerante a errores de escritura)
        if (this.fuzzyIntents.length === 0) this.registerFuzzyIntents();
        for (const intent of this.fuzzyIntents) {
            if (this.fuzzyMatch(text, intent.keywords)) {
                await intent.handler(chatId, username);
                return true;
            }
        }

        // 3. No coincidió nada → enviar a IA
        return false;
    }

    // ========================================================
    // Integración directa con Gemini AI
    // ========================================================

    /**
     * Guardar mensaje en historial de conversación
     */
    private addToHistory(chatId: number, role: string, text: string): void {
        if (!this.conversationHistory.has(chatId)) {
            this.conversationHistory.set(chatId, []);
        }
        const history = this.conversationHistory.get(chatId)!;

        // Limpiar mensajes expirados
        const now = Date.now();
        const filtered = history.filter(h => now - h.timestamp < this.HISTORY_TTL_MS);

        filtered.push({ role, text, timestamp: now });

        // Mantener solo los últimos N
        if (filtered.length > this.MAX_HISTORY_PER_CHAT) {
            filtered.splice(0, filtered.length - this.MAX_HISTORY_PER_CHAT);
        }

        this.conversationHistory.set(chatId, filtered);
    }

    /**
     * Obtener historial formateado para el prompt
     */
    private getHistoryForPrompt(chatId: number): string {
        const history = this.conversationHistory.get(chatId);
        if (!history || history.length === 0) return '';

        const now = Date.now();
        const recent = history.filter(h => now - h.timestamp < this.HISTORY_TTL_MS);
        if (recent.length === 0) return '';

        return '\nHISTORIAL DE CONVERSACIÓN RECIENTE:\n' +
            recent.map(h => `${h.role === 'user' ? 'Usuario' : 'Bot'}: ${h.text}`).join('\n') + '\n';
    }

    /**
     * Obtener contexto de la base de datos para la IA
     */
    private async getAIContext(): Promise<string> {
        try {
            const [tournaments, games, recentMatches] = await Promise.all([
                prisma.tournament.findMany({
                    where: { status: { in: ['REGISTRATION_OPEN', 'IN_PROGRESS', 'PUBLISHED'] } },
                    include: { game: { select: { name: true } } },
                    orderBy: { start_date: 'asc' },
                    take: 10
                }).catch(() => []),
                prisma.game.findMany({
                    select: { name: true, slug: true, team_size_default: true }
                }).catch(() => []),
                prisma.match.findMany({
                    where: { status: { in: ['SCHEDULED', 'LIVE'] } },
                    include: {
                        tournament: { select: { name: true } },
                        home_team: { select: { name: true } },
                        away_team: { select: { name: true } }
                    },
                    orderBy: { scheduled_datetime: 'asc' },
                    take: 5
                }).catch(() => [])
            ]);

            let context = '';
            if (tournaments.length > 0) {
                context += 'TORNEOS ACTIVOS: ' + tournaments.map(t =>
                    `${t.name} (${(t.game as any)?.name || 'N/A'}, ${t.status}, premio: $${t.prize_pool || 0})`
                ).join('; ') + '.\n';
            } else {
                context += 'No hay torneos activos actualmente.\n';
            }

            if (games.length > 0) {
                context += 'JUEGOS DISPONIBLES: ' + games.map(g => g.name).join(', ') + '.\n';
            }

            if (recentMatches.length > 0) {
                context += 'PARTIDAS PRÓXIMAS/EN VIVO: ' + recentMatches.map(m =>
                    `${(m as any).home_team?.name || 'TBD'} vs ${(m as any).away_team?.name || 'TBD'} (${(m as any).tournament?.name}, ${m.status})`
                ).join('; ') + '.\n';
            }

            return context || 'No hay datos disponibles actualmente.';
        } catch (error) {
            console.error('Error obteniendo contexto para IA:', error);
            return 'No se pudieron obtener datos del sistema.';
        }
    }

    /**
     * Responder usando IA (Gemini) con contexto de BD e historial
     */
    async respondWithAI(chatId: number, text: string, username: string): Promise<void> {
        if (!this.aiService) {
            await this.sendDefaultResponse(chatId, username);
            return;
        }

        try {
            // Indicador de "escribiendo..."
            await this.sendChatAction(chatId, 'typing');

            // Guardar mensaje del usuario en historial
            this.addToHistory(chatId, 'user', text);

            // Obtener contexto de la BD
            const dbContext = await this.getAIContext();
            const historyContext = this.getHistoryForPrompt(chatId);

            // Generar respuesta con IA
            const fullContext = dbContext + historyContext;
            const response = await this.aiService.chat(text, fullContext);

            // Guardar respuesta del bot en historial
            this.addToHistory(chatId, 'bot', response);

            // Enviar respuesta (limitar a 4096 chars de Telegram)
            const truncated = response.length > 4000 ? response.substring(0, 4000) + '...' : response;
            await this.sendMessage({
                chatId,
                text: truncated,
                parseMode: 'HTML'
            });
        } catch (error) {
            console.error('Error en respuesta IA:', error);
            // Fallback: intentar enviar sin HTML por si tiene tags mal formados
            try {
                await this.sendMessage({
                    chatId,
                    text: '🤖 Hmm, no pude procesar eso. ¿Puedes reformularlo o usar /ayuda?'
                });
            } catch {
                // silently fail
            }
        }
    }

    /**
     * Enviar acción de chat (typing, etc.)
     */
    async sendChatAction(chatId: number, action: string = 'typing'): Promise<void> {
        try {
            await fetch(`${this.config.apiUrl}/sendChatAction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, action })
            });
        } catch {
            // no-op, typing indicator is non-critical
        }
    }

    /**
     * Respuesta por defecto cuando no hay IA disponible
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

        // Actualizar menú de comandos en Telegram (deferred, non-blocking)
        this.setMyCommandsWithRetry();
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
     * Fetch with retry logic for transient network errors (ECONNRESET, ETIMEDOUT, etc.)
     */
    private async fetchWithRetry(url: string, options?: RequestInit, attempts = this.RETRY_ATTEMPTS): Promise<Response> {
        for (let i = 0; i < attempts; i++) {
            try {
                return await fetch(url, options);
            } catch (error: any) {
                const isRetryable = error?.cause?.code === 'ECONNRESET'
                    || error?.cause?.code === 'ETIMEDOUT'
                    || error?.cause?.code === 'ENOTFOUND'
                    || error?.cause?.code === 'UND_ERR_SOCKET'
                    || error?.message?.includes('fetch failed');

                if (isRetryable && i < attempts - 1) {
                    const delay = this.RETRY_DELAY_MS * Math.pow(2, i); // exponential backoff
                    console.warn(`Telegram fetch attempt ${i + 1}/${attempts} failed (${error?.cause?.code || 'unknown'}), retrying in ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw error;
            }
        }
        throw new Error('fetchWithRetry: exhausted all attempts');
    }

    /**
     * Set bot commands in Telegram UI with deferred retry on persistent failure.
     * Called once during constructor — retries in background if network is down at startup.
     */
    private async setMyCommandsWithRetry(): Promise<void> {
        const commands = [
            { command: 'start', description: 'Iniciar y bienvenida' },
            { command: 'torneos', description: 'Ver torneos activos' },
            { command: 'clanes', description: 'Ver clanes registrados' },
            { command: 'miclan', description: 'Mi información de equipo' },
            { command: 'ranking', description: 'Ver top jugadores' },
            { command: 'proximas', description: 'Próximas partidas' },
            { command: 'envivo', description: 'Partidas en vivo' },
            { command: 'juegos', description: 'Juegos disponibles' },
            { command: 'ayuda', description: 'Ayuda y soporte' }
        ];

        const maxScheduledRetries = 3;
        for (let attempt = 0; attempt <= maxScheduledRetries; attempt++) {
            const result = await this.setMyCommands(commands);
            if (result.ok) {
                console.log('✅ Telegram commands registered successfully');
                return;
            }
            if (attempt < maxScheduledRetries) {
                const delay = 30_000 * (attempt + 1); // 30s, 60s, 90s
                console.warn(`⚠️ setMyCommands failed (attempt ${attempt + 1}/${maxScheduledRetries + 1}), scheduling retry in ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
        console.error('❌ setMyCommands failed after all scheduled retries — commands not registered');
    }

    /**
     * Set bot commands in Telegram UI
     */
    async setMyCommands(commands: { command: string; description: string }[]): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            return { ok: false, description: 'Bot token not configured' };
        }

        try {
            const response = await this.fetchWithRetry(`${this.config.apiUrl}/setMyCommands`, {
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
            // Procesar como mensaje conversacional (regex → fuzzy → IA)
            const handled = await this.processConversation(chatId, text, username);
            if (!handled) {
                // Si ningún patrón coincidió → responder con IA directamente
                await this.respondWithAI(chatId, text, username);
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