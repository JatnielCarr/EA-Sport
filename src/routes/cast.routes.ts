import { FastifyInstance } from 'fastify';
import { aiService } from '../services/ai';
import { prisma } from '../config/database';

/**
 * =====================================================
 * RUTAS DE CASTER VIRTUAL (IA Comentarista)
 * =====================================================
 * Genera crónicas narradas de partidas y torneos
 * estilo comentarista deportivo profesional.
 * =====================================================
 */

export async function castRoutes(app: FastifyInstance) {

    // =====================================================
    // 1. CRÓNICA DE UNA PARTIDA
    // =====================================================
    app.get('/ai/cast/:matchId', {
        schema: {
            tags: ['AI - Caster Virtual'],
            description: 'Genera una crónica narrada de una partida completada, estilo comentarista de esports',
            params: {
                type: 'object',
                properties: { matchId: { type: 'string' } }
            }
        }
    }, async (request, reply) => {
        try {
            const { matchId } = request.params as { matchId: string };

            const match = await prisma.match.findUnique({
                where: { id: matchId },
                include: {
                    tournament: { include: { game: true } },
                    home_team: {
                        include: {
                            players: { include: { user: { select: { username: true } } } }
                        }
                    },
                    away_team: {
                        include: {
                            players: { include: { user: { select: { username: true } } } }
                        }
                    },
                    winner: true,
                    results: true
                }
            });

            if (!match) {
                return reply.status(404).send({ success: false, error: 'Partido no encontrado' });
            }

            if (match.status !== 'COMPLETED') {
                return reply.status(400).send({
                    success: false,
                    error: 'Solo se pueden generar crónicas de partidas completadas'
                });
            }

            const matchData = {
                tournament: match.tournament.name,
                game: match.tournament.game?.name || 'Unknown',
                round: match.round,
                matchNumber: match.match_number,
                homeTeam: {
                    name: match.home_team?.name || 'TBD',
                    tag: match.home_team?.tag,
                    players: match.home_team?.players.map(p => p.user.username) || []
                },
                awayTeam: {
                    name: match.away_team?.name || 'TBD',
                    tag: match.away_team?.tag,
                    players: match.away_team?.players.map(p => p.user.username) || []
                },
                homeScore: match.home_score,
                awayScore: match.away_score,
                winner: match.winner?.name || 'No definido',
                bestOf: match.best_of,
                wasDisputed: match.results.some((r: any) => r.disputed)
            };

            const cast = await aiService.generateMatchCast(matchData);

            return {
                success: true,
                data: {
                    matchId: match.id,
                    cast,
                    matchInfo: {
                        homeTeam: matchData.homeTeam.name,
                        awayTeam: matchData.awayTeam.name,
                        score: `${match.home_score} - ${match.away_score}`,
                        winner: matchData.winner,
                        tournament: matchData.tournament,
                        game: matchData.game
                    }
                }
            };
        } catch (error: any) {
            console.error('Cast generation error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error al generar la crónica' });
        }
    });

    // =====================================================
    // 2. CRÓNICA DEL ESTADO ACTUAL DE UN TORNEO
    // =====================================================
    app.get('/ai/cast/tournament/:tournamentId', {
        schema: {
            tags: ['AI - Caster Virtual'],
            description: 'Genera un resumen narrativo del estado actual de un torneo',
            params: {
                type: 'object',
                properties: { tournamentId: { type: 'string' } }
            }
        }
    }, async (request, reply) => {
        try {
            const { tournamentId } = request.params as { tournamentId: string };

            const tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                include: {
                    game: true,
                    teams: {
                        include: {
                            standings: true
                        }
                    },
                    matches: {
                        where: { status: 'COMPLETED' },
                        include: {
                            home_team: { select: { name: true, tag: true } },
                            away_team: { select: { name: true, tag: true } },
                            winner: { select: { name: true, tag: true } }
                        },
                        orderBy: [{ round: 'asc' }, { match_number: 'asc' }]
                    }
                }
            });

            if (!tournament) {
                return reply.status(404).send({ success: false, error: 'Torneo no encontrado' });
            }

            // Count remaining and total matches
            const totalMatches = await prisma.match.count({
                where: { tournament_id: tournamentId }
            });
            const completedMatches = tournament.matches.length;

            const tournamentData = {
                name: tournament.name,
                game: tournament.game?.name,
                format: tournament.format,
                status: tournament.status,
                totalTeams: tournament.teams.length,
                progress: `${completedMatches}/${totalMatches} partidos completados`,
                completedMatches: tournament.matches.map(m => ({
                    round: m.round,
                    homeTeam: m.home_team?.name,
                    awayTeam: m.away_team?.name,
                    score: `${m.home_score}-${m.away_score}`,
                    winner: m.winner?.name
                })),
                standings: tournament.teams
                    .filter(t => t.standings.length > 0)
                    .sort((a, b) => (a.standings[0]?.position || 999) - (b.standings[0]?.position || 999))
                    .slice(0, 8)
                    .map(t => ({
                        team: t.name,
                        position: t.standings[0]?.position,
                        won: t.standings[0]?.won,
                        lost: t.standings[0]?.lost
                    }))
            };

            const cast = await aiService.generateMatchCast(tournamentData);

            return {
                success: true,
                data: {
                    tournamentId: tournament.id,
                    cast,
                    tournamentInfo: {
                        name: tournament.name,
                        game: tournament.game?.name,
                        status: tournament.status,
                        progress: tournamentData.progress
                    }
                }
            };
        } catch (error: any) {
            console.error('Tournament cast error:', error.message);
            return reply.status(500).send({ success: false, error: 'Error al generar el resumen del torneo' });
        }
    });
}
