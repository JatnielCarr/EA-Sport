import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database';
import { authenticate } from '../middleware';

/**
 * =====================================================
 * SISTEMA DE REPUTACIÓN
 * =====================================================
 * Los jugadores se califican entre sí después de cada
 * partida. La puntuación acumulada define su reputación.
 * =====================================================
 */

export async function reputationController(app: FastifyInstance) {

    // =====================================================
    // 1. CALIFICAR A UN JUGADOR POST-PARTIDA
    // =====================================================
    app.post('/reputation/review', {
        preHandler: [authenticate],
        schema: {
            tags: ['Reputation'],
            description: 'Calificar a un jugador después de una partida. Solo jugadores que participaron en el mismo partido.',
            body: {
                type: 'object',
                required: ['reviewed_user_id', 'match_id', 'sportsmanship', 'communication'],
                properties: {
                    reviewed_user_id: { type: 'string' },
                    match_id: { type: 'string' },
                    sportsmanship: { type: 'integer', minimum: 1, maximum: 5 },
                    communication: { type: 'integer', minimum: 1, maximum: 5 },
                    comment: { type: 'string', maxLength: 500 }
                }
            }
        }
    }, async (request, reply) => {
        const user = (request as any).serverUser;
        const { reviewed_user_id, match_id, sportsmanship, communication, comment } = request.body as any;

        // Cannot review yourself
        if (user.id === reviewed_user_id) {
            return reply.status(400).send({ success: false, error: 'No puedes calificarte a ti mismo' });
        }

        // Verify match exists and is completed
        const match = await prisma.match.findUnique({
            where: { id: match_id },
            include: {
                home_team: { include: { players: true } },
                away_team: { include: { players: true } }
            }
        });

        if (!match) {
            return reply.status(404).send({ success: false, error: 'Partido no encontrado' });
        }

        if (match.status !== 'COMPLETED') {
            return reply.status(400).send({ success: false, error: 'Solo puedes calificar después de un partido completado' });
        }

        // Verify both users participated in this match
        const allPlayers = [
            ...(match.home_team?.players || []),
            ...(match.away_team?.players || [])
        ];
        const reviewerInMatch = allPlayers.some(p => p.user_id === user.id);
        const reviewedInMatch = allPlayers.some(p => p.user_id === reviewed_user_id);

        if (!reviewerInMatch || !reviewedInMatch) {
            return reply.status(403).send({
                success: false,
                error: 'Ambos jugadores deben haber participado en este partido'
            });
        }

        // Check if already reviewed
        const existing = await prisma.reputationReview.findUnique({
            where: {
                reviewer_id_reviewed_user_id_match_id: {
                    reviewer_id: user.id,
                    reviewed_user_id,
                    match_id
                }
            }
        });

        if (existing) {
            return reply.status(400).send({ success: false, error: 'Ya calificaste a este jugador en este partido' });
        }

        // Create the review
        const review = await prisma.reputationReview.create({
            data: {
                reviewer_id: user.id,
                reviewed_user_id,
                match_id,
                sportsmanship,
                communication,
                comment: comment || null
            }
        });

        // Update or create the PlayerReputation
        const allReviews = await prisma.reputationReview.findMany({
            where: { reviewed_user_id }
        });

        const avgSportsmanship = allReviews.reduce((sum, r) => sum + r.sportsmanship, 0) / allReviews.length;
        const avgCommunication = allReviews.reduce((sum, r) => sum + r.communication, 0) / allReviews.length;
        const positiveCount = allReviews.filter(r => (r.sportsmanship + r.communication) / 2 >= 3.5).length;
        const negativeCount = allReviews.filter(r => (r.sportsmanship + r.communication) / 2 < 2.5).length;
        const isFlagged = avgSportsmanship < 2.0 || negativeCount > allReviews.length * 0.5;

        await prisma.playerReputation.upsert({
            where: { user_id: reviewed_user_id },
            create: {
                user_id: reviewed_user_id,
                sportsmanship_score: Math.round(avgSportsmanship * 10) / 10,
                communication_score: Math.round(avgCommunication * 10) / 10,
                total_reviews: allReviews.length,
                positive_reviews: positiveCount,
                negative_reviews: negativeCount,
                is_flagged: isFlagged
            },
            update: {
                sportsmanship_score: Math.round(avgSportsmanship * 10) / 10,
                communication_score: Math.round(avgCommunication * 10) / 10,
                total_reviews: allReviews.length,
                positive_reviews: positiveCount,
                negative_reviews: negativeCount,
                is_flagged: isFlagged
            }
        });

        return {
            success: true,
            data: review,
            message: `Calificación registrada: Deportividad ${sportsmanship}/5, Comunicación ${communication}/5`
        };
    });

    // =====================================================
    // 2. VER REPUTACIÓN DE UN JUGADOR
    // =====================================================
    app.get('/reputation/:userId', {
        schema: {
            tags: ['Reputation'],
            description: 'Ver la reputación acumulada de un jugador',
            params: { type: 'object', properties: { userId: { type: 'string' } } }
        }
    }, async (request, reply) => {
        const { userId } = request.params as { userId: string };

        const reputation = await prisma.playerReputation.findUnique({
            where: { user_id: userId },
            include: {
                user: { select: { id: true, username: true, avatar_url: true } }
            }
        });

        if (!reputation) {
            return {
                success: true,
                data: {
                    user_id: userId,
                    sportsmanship_score: 5.0,
                    communication_score: 5.0,
                    total_reviews: 0,
                    positive_reviews: 0,
                    negative_reviews: 0,
                    is_flagged: false,
                    badge: '🆕 Sin calificaciones aún'
                }
            };
        }

        // Generate reputation badge
        const avg = (reputation.sportsmanship_score + reputation.communication_score) / 2;
        let badge: string;
        if (avg >= 4.5) badge = '🌟 Jugador Ejemplar';
        else if (avg >= 4.0) badge = '⭐ Excelente Deportividad';
        else if (avg >= 3.5) badge = '👍 Buen Jugador';
        else if (avg >= 2.5) badge = '😐 Promedio';
        else if (avg >= 1.5) badge = '⚠️ Necesita Mejorar';
        else badge = '🚩 Comportamiento Reportado';

        return {
            success: true,
            data: {
                ...reputation,
                overall_score: Math.round(avg * 10) / 10,
                badge
            }
        };
    });

    // =====================================================
    // 3. VER RESEÑAS DE UN JUGADOR
    // =====================================================
    app.get('/reputation/:userId/reviews', {
        schema: {
            tags: ['Reputation'],
            description: 'Ver las reseñas individuales de un jugador',
            params: { type: 'object', properties: { userId: { type: 'string' } } }
        }
    }, async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const query = request.query as { limit?: string; offset?: string };
        const limit = parseInt(query.limit || '20');
        const offset = parseInt(query.offset || '0');

        const [reviews, total] = await Promise.all([
            prisma.reputationReview.findMany({
                where: { reviewed_user_id: userId },
                include: {
                    reviewer: { select: { id: true, username: true, avatar_url: true } },
                    match: {
                        select: {
                            id: true,
                            tournament: { select: { name: true } },
                            home_team: { select: { name: true } },
                            away_team: { select: { name: true } }
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.reputationReview.count({ where: { reviewed_user_id: userId } })
        ]);

        return {
            success: true,
            data: { reviews, total, limit, offset }
        };
    });

    // =====================================================
    // 4. RANKING DE REPUTACIÓN (LEADERBOARD)
    // =====================================================
    app.get('/reputation/leaderboard/top', {
        schema: {
            tags: ['Reputation'],
            description: 'Top jugadores con mejor reputación'
        }
    }, async (request, reply) => {
        const query = request.query as { limit?: string };
        const limit = parseInt(query.limit || '25');

        const topPlayers = await prisma.playerReputation.findMany({
            where: { total_reviews: { gte: 3 } }, // Mínimo 3 reseñas para aparecer
            orderBy: { sportsmanship_score: 'desc' },
            take: limit,
            include: {
                user: { select: { id: true, username: true, avatar_url: true } }
            }
        });

        return {
            success: true,
            data: topPlayers.map((p, i) => ({
                rank: i + 1,
                user: p.user,
                sportsmanship_score: p.sportsmanship_score,
                communication_score: p.communication_score,
                total_reviews: p.total_reviews,
                overall: Math.round(((p.sportsmanship_score + p.communication_score) / 2) * 10) / 10
            }))
        };
    });
}
