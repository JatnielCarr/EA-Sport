import { FastifyInstance } from 'fastify';
import { aiService } from '../services/ai';
import { prisma } from '../config/database';

export async function aiRoutes(app: FastifyInstance) {

    // =====================================================
    // Helper: build context from DB for chatbot
    // =====================================================
    async function buildContextForChat() {
        try {
            const [tournaments, games, recentMatches] = await Promise.all([
                prisma.tournament.findMany({
                    take: 10,
                    orderBy: { created_at: 'desc' },
                    select: { id: true, name: true, status: true, format: true, start_date: true, max_participants: true, entry_fee: true, prize_pool: true, region: true }
                }),
                prisma.game.findMany({ select: { id: true, name: true, slug: true } }),
                prisma.match.findMany({
                    take: 5,
                    orderBy: { created_at: 'desc' },
                    where: { status: { in: ['LIVE', 'COMPLETED'] } },
                    select: { id: true, status: true, home_score: true, away_score: true, round: true }
                })
            ]);

            return `Torneos activos: ${JSON.stringify(tournaments)}
Juegos disponibles: ${JSON.stringify(games)}
Partidos recientes: ${JSON.stringify(recentMatches)}`;
        } catch {
            return "No se pudo acceder a la base de datos en este momento.";
        }
    }

    // =====================================================
    // 1. CHATBOT
    // =====================================================
    app.post('/ai/chat', {
        schema: {
            tags: ['AI'],
            description: 'Chat with ApexBot AI assistant',
            body: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: { type: 'string', minLength: 1 },
                    pageContext: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { message, pageContext } = request.body as { message: string; pageContext?: string };
            const context = await buildContextForChat();
            const response = await aiService.chat(message, context, pageContext);
            return { success: true, data: { response } };
        } catch (error: any) {
            console.error('AI Chat error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error al procesar tu mensaje' });
        }
    });

    // =====================================================
    // 2. GENERATE DESCRIPTION
    // =====================================================
    app.post('/ai/generate-description', {
        schema: {
            tags: ['AI'],
            description: 'Generate description for tournament or clan',
            body: {
                type: 'object',
                required: ['type'],
                properties: {
                    type: { type: 'string', enum: ['tournament', 'clan'] },
                    name: { type: 'string' },
                    game: { type: 'string' },
                    format: { type: 'string' },
                    teamSize: { type: 'number' },
                    maxParticipants: { type: 'number' },
                    region: { type: 'string' },
                    entryFee: { type: 'number' },
                    prizePool: { type: 'number' },
                    tag: { type: 'string' },
                    location: { type: 'string' },
                    accessType: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const body = request.body as any;
            const description = await aiService.generateDescription(body.type, body);
            return { success: true, data: { description } };
        } catch (error: any) {
            console.error('AI Description error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error al generar descripción' });
        }
    });

    // =====================================================
    // 3. SMART SEARCH
    // =====================================================
    app.post('/ai/search', {
        schema: {
            tags: ['AI'],
            description: 'AI-powered smart search with natural language',
            body: {
                type: 'object',
                required: ['query'],
                properties: {
                    query: { type: 'string', minLength: 1 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { query } = request.body as { query: string };
            const games = await prisma.game.findMany({ select: { name: true, slug: true } });
            const availableData = `Juegos: ${games.map(g => g.name).join(', ')}. Formatos: SINGLE_ELIMINATION, DOUBLE_ELIMINATION, ROUND_ROBIN, SWISS. Regiones: LATAM, NA, EU, ASIA. Estados: REGISTRATION_OPEN, IN_PROGRESS, COMPLETED.`;

            const searchResult = await aiService.smartSearch(query, availableData);

            // Execute the search based on AI interpretation
            let results: any[] = [];
            if (searchResult.intent === 'search_tournaments') {
                const where: any = {};
                if (searchResult.filters.status) where.status = searchResult.filters.status;
                if (searchResult.filters.format) where.format = searchResult.filters.format;
                if (searchResult.filters.region) where.region = searchResult.filters.region;
                if (searchResult.filters.free_only) where.entry_fee = 0;
                if (searchResult.filters.game) {
                    const game = await prisma.game.findFirst({ where: { name: { contains: searchResult.filters.game } } });
                    if (game) where.game_id = game.id;
                }
                results = await prisma.tournament.findMany({ where, take: 20, orderBy: { created_at: 'desc' }, include: { game: true } });
            } else if (searchResult.intent === 'search_clans') {
                results = await prisma.clan.findMany({ take: 20, orderBy: { created_at: 'desc' } });
            } else if (searchResult.intent === 'search_players') {
                const users = await prisma.user.findMany({
                    take: 20,
                    where: { username: { contains: searchResult.filters.game || '' } },
                    select: { id: true, username: true, role: true, created_at: true }
                });
                results = users;
            }

            return { success: true, data: { interpretation: searchResult, results } };
        } catch (error: any) {
            console.error('AI Search error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error en búsqueda inteligente' });
        }
    });

    // =====================================================
    // 4. MATCH PREDICTIONS
    // =====================================================
    app.get('/ai/predictions/:tournamentId', {
        schema: {
            tags: ['AI'],
            description: 'Get AI predictions for tournament matches',
            params: { type: 'object', properties: { tournamentId: { type: 'string' } } }
        }
    }, async (request, reply) => {
        try {
            const { tournamentId } = request.params as { tournamentId: string };
            const matches = await prisma.match.findMany({
                where: { tournament_id: tournamentId, status: 'SCHEDULED' },
                include: {
                    home_team: { include: { players: { include: { user: { include: { player_stats: true } } } } } },
                    away_team: { include: { players: { include: { user: { include: { player_stats: true } } } } } }
                }
            });

            const predictions = [];
            for (const match of matches.slice(0, 8)) { // Limit to 8 predictions
                if (!match.home_team || !match.away_team) continue;

                const team1Stats = match.home_team.players.flatMap(p => p.user.player_stats);
                const team2Stats = match.away_team.players.flatMap(p => p.user.player_stats);

                const team1Data = {
                    name: match.home_team.name,
                    tag: match.home_team.tag,
                    avgWinRate: team1Stats.length > 0 ? team1Stats.reduce((a, s) => a + s.win_rate, 0) / team1Stats.length : 50,
                    avgRating: team1Stats.length > 0 ? team1Stats.reduce((a, s) => a + s.rating, 0) / team1Stats.length : 1000,
                    totalMatches: team1Stats.reduce((a, s) => a + s.total_matches, 0)
                };
                const team2Data = {
                    name: match.away_team.name,
                    tag: match.away_team.tag,
                    avgWinRate: team2Stats.length > 0 ? team2Stats.reduce((a, s) => a + s.win_rate, 0) / team2Stats.length : 50,
                    avgRating: team2Stats.length > 0 ? team2Stats.reduce((a, s) => a + s.rating, 0) / team2Stats.length : 1000,
                    totalMatches: team2Stats.reduce((a, s) => a + s.total_matches, 0)
                };

                const prediction = await aiService.predictMatch(team1Data, team2Data);
                predictions.push({ matchId: match.id, ...prediction });
            }

            return { success: true, data: predictions };
        } catch (error: any) {
            console.error('AI Predictions error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error generando predicciones' });
        }
    });

    // =====================================================
    // 5. SMART SEEDING
    // =====================================================
    app.post('/ai/seeding/:tournamentId', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['AI'],
            description: 'Generate AI-based smart seeding for tournament bracket',
            params: { type: 'object', properties: { tournamentId: { type: 'string' } } }
        }
    }, async (request: any, reply) => {
        try {
            const { tournamentId } = request.params as { tournamentId: string };
            const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
            if (!tournament) return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
            if (tournament.organizer_id !== request.user.id && request.user.role !== 'ADMIN') {
                return reply.status(403).send({ success: false, error: 'No tienes permiso' });
            }

            const teams = await prisma.team.findMany({
                where: { tournament_id: tournamentId },
                include: { players: { include: { user: { include: { player_stats: true } } } } }
            });

            const teamsData = teams.map(team => {
                const stats = team.players.flatMap(p => p.user.player_stats);
                return {
                    id: team.id,
                    name: team.name,
                    tag: team.tag,
                    playerCount: team.players.length,
                    avgWinRate: stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.win_rate, 0) / stats.length) : 0,
                    avgRating: stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.rating, 0) / stats.length) : 1000,
                    totalMatches: stats.reduce((a, s) => a + s.total_matches, 0)
                };
            });

            const seeding = await aiService.generateSmartSeeding(teamsData);

            // Apply seeds to teams
            for (const s of seeding) {
                await prisma.team.update({ where: { id: s.teamId }, data: { seed: s.seed } }).catch(() => { });
            }

            return { success: true, data: seeding };
        } catch (error: any) {
            console.error('AI Seeding error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error generando seeding' });
        }
    });

    // =====================================================
    // 6. PLAYER INSIGHTS / DASHBOARD
    // =====================================================
    app.get('/ai/insights/:userId', {
        schema: {
            tags: ['AI'],
            description: 'Get AI insights for a player',
            params: { type: 'object', properties: { userId: { type: 'string' } } }
        }
    }, async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const [user, stats, recentTeams] = await Promise.all([
                prisma.user.findUnique({ where: { id: userId }, select: { username: true, created_at: true } }),
                prisma.playerStats.findMany({ where: { user_id: userId }, include: { game: true } }),
                prisma.teamPlayer.findMany({
                    where: { user_id: userId },
                    take: 5,
                    orderBy: { joined_at: 'desc' },
                    include: { team: { include: { tournament: true } } }
                })
            ]);

            if (!user) return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });

            const playerData = {
                username: user.username,
                accountAge: user.created_at,
                games: stats.map(s => ({
                    game: s.game.name,
                    totalMatches: s.total_matches,
                    wins: s.wins,
                    losses: s.losses,
                    winRate: s.win_rate,
                    rating: s.rating,
                    rank: s.rank
                })),
                recentTournaments: recentTeams.map(t => ({
                    tournament: t.team.tournament.name,
                    teamName: t.team.name,
                    status: t.team.tournament.status
                }))
            };

            const insights = await aiService.generateInsights(playerData);
            return { success: true, data: insights };
        } catch (error: any) {
            console.error('AI Insights error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error generando insights' });
        }
    });

    // =====================================================
    // 7. TOURNAMENT RECOMMENDATIONS
    // =====================================================
    app.get('/ai/recommendations/:userId', {
        schema: {
            tags: ['AI'],
            description: 'Get tournament recommendations for a user',
            params: { type: 'object', properties: { userId: { type: 'string' } } }
        }
    }, async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const [stats, tournaments] = await Promise.all([
                prisma.playerStats.findMany({ where: { user_id: userId }, include: { game: true } }),
                prisma.tournament.findMany({
                    where: { status: { in: ['REGISTRATION_OPEN', 'PUBLISHED'] } },
                    include: { game: true, teams: true },
                    take: 15,
                    orderBy: { start_date: 'asc' }
                })
            ]);

            const userProfile = {
                preferredGames: stats.map(s => s.game.name),
                avgRating: stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.rating, 0) / stats.length) : 1000,
                avgWinRate: stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.win_rate, 0) / stats.length) : 0,
                totalExperience: stats.reduce((a, s) => a + s.total_matches, 0)
            };

            const availableTournaments = tournaments.map(t => ({
                id: t.id,
                name: t.name,
                game: t.game.name,
                format: t.format,
                teamSize: t.team_size,
                entryFee: Number(t.entry_fee),
                prizePool: Number(t.prize_pool),
                currentTeams: t.teams.length,
                maxParticipants: t.max_participants,
                startDate: t.start_date,
                region: t.region
            }));

            const recommendations = await aiService.recommendTournaments(userProfile, availableTournaments);
            return { success: true, data: recommendations };
        } catch (error: any) {
            console.error('AI Recommendations error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error generando recomendaciones' });
        }
    });

    // =====================================================
    // 8. TOURNAMENT SUMMARY
    // =====================================================
    app.get('/ai/tournament-summary/:tournamentId', {
        schema: {
            tags: ['AI'],
            description: 'Generate AI summary for a completed tournament',
            params: { type: 'object', properties: { tournamentId: { type: 'string' } } }
        }
    }, async (request, reply) => {
        try {
            const { tournamentId } = request.params as { tournamentId: string };
            const tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                include: {
                    game: true,
                    teams: { include: { standings: true } },
                    matches: { include: { home_team: true, away_team: true, winner: true } }
                }
            });

            if (!tournament) return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });

            const tournamentData = {
                name: tournament.name,
                game: tournament.game.name,
                format: tournament.format,
                totalTeams: tournament.teams.length,
                matches: tournament.matches.map(m => ({
                    round: m.round,
                    homeTeam: m.home_team?.name,
                    awayTeam: m.away_team?.name,
                    score: `${m.home_score}-${m.away_score}`,
                    winner: m.winner?.name
                })),
                standings: tournament.teams
                    .filter(t => t.standings.length > 0)
                    .sort((a, b) => (a.standings[0]?.position || 999) - (b.standings[0]?.position || 999))
                    .map(t => ({ team: t.name, position: t.standings[0]?.position, won: t.standings[0]?.won, lost: t.standings[0]?.lost }))
            };

            const summary = await aiService.summarizeTournament(tournamentData);
            return { success: true, data: { summary } };
        } catch (error: any) {
            console.error('AI Summary error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error generando resumen' });
        }
    });

    // =====================================================
    // 9. CONTENT MODERATION
    // =====================================================
    app.post('/ai/moderate', {
        schema: {
            tags: ['AI'],
            description: 'Moderate chat content with AI',
            body: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: { type: 'string', minLength: 1 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { message } = request.body as { message: string };
            const result = await aiService.moderateContent(message);
            return { success: true, data: result };
        } catch (error: any) {
            console.error('AI Moderation error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error en moderación' });
        }
    });

    // =====================================================
    // 10. ANTI-CHEAT ANALYSIS
    // =====================================================
    app.get('/ai/anticheat/:userId', {
        preHandler: [app.authenticate],
        schema: {
            tags: ['AI'],
            description: 'Analyze player for suspicious patterns (admin/organizer only)',
            params: { type: 'object', properties: { userId: { type: 'string' } } }
        }
    }, async (request: any, reply) => {
        try {
            if (request.user.role !== 'ADMIN' && request.user.role !== 'ORGANIZER') {
                return reply.status(403).send({ success: false, error: 'Solo administradores y organizadores' });
            }

            const { userId } = request.params as { userId: string };
            const stats = await prisma.playerStats.findMany({ where: { user_id: userId }, include: { game: true } });
            const teams = await prisma.teamPlayer.findMany({
                where: { user_id: userId },
                include: { team: { include: { standings: true, tournament: true } } }
            });

            const matchData = stats.map(s => ({
                game: s.game.name,
                totalMatches: s.total_matches,
                wins: s.wins,
                losses: s.losses,
                winRate: s.win_rate,
                rating: s.rating,
                rank: s.rank
            }));

            const result = await aiService.analyzeForCheating(matchData);
            return { success: true, data: result };
        } catch (error: any) {
            console.error('AI AntiCheat error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error en análisis anti-cheat' });
        }
    });

    // =====================================================
    // 11. PLAYER PERFORMANCE ANALYSIS
    // =====================================================
    app.get('/ai/performance/:userId', {
        schema: {
            tags: ['AI'],
            description: 'Get detailed AI performance analysis for a player',
            params: { type: 'object', properties: { userId: { type: 'string' } } }
        }
    }, async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const [user, stats] = await Promise.all([
                prisma.user.findUnique({ where: { id: userId }, select: { username: true, created_at: true } }),
                prisma.playerStats.findMany({ where: { user_id: userId }, include: { game: true } })
            ]);

            if (!user) return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });

            const playerData = {
                username: user.username,
                memberSince: user.created_at,
                games: stats.map(s => ({
                    game: s.game.name,
                    matches: s.total_matches,
                    wins: s.wins,
                    losses: s.losses,
                    draws: s.draws,
                    winRate: s.win_rate,
                    rating: s.rating,
                    avgScore: s.average_score
                }))
            };

            const analysis = await aiService.analyzePlayerPerformance(playerData);
            return { success: true, data: analysis };
        } catch (error: any) {
            console.error('AI Performance error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error en análisis de rendimiento' });
        }
    });

    // =====================================================
    // SUGGESTIONS (quick questions for chatbot)
    // =====================================================
    app.get('/ai/suggestions', {
        schema: {
            tags: ['AI'],
            description: 'Get suggested questions for AI chatbot'
        }
    }, async () => {
        return {
            success: true,
            data: [
                "¿Qué torneos están abiertos ahora?",
                "¿Cómo me registro en un torneo?",
                "¿Cuáles son las reglas generales?",
                "¿Qué juegos están disponibles?",
                "¿Cómo funciona el sistema de rankings?",
                "¿Qué beneficios tiene la suscripción Premium?"
            ]
        };
    });
}
