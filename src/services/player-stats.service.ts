import { prisma } from '../config/database';

/**
 * =====================================================
 * PLAYER STATS SERVICE — Auto-update after matches
 * =====================================================
 */

export const playerStatsService = {

  /**
   * Update stats for all players involved in a completed match.
   * Called after reportResult in tournament-engine.
   */
  async updateAfterMatch(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: { select: { game_id: true } },
        home_team: { include: { players: { where: { status: 'ACTIVE' } } } },
        away_team: { include: { players: { where: { status: 'ACTIVE' } } } }
      }
    });

    if (!match || match.status !== 'COMPLETED' || !match.winner_id) return;

    const gameId = match.tournament.game_id;
    const winnerTeamId = match.winner_id;

    const homePlayers = match.home_team?.players || [];
    const awayPlayers = match.away_team?.players || [];
    const allPlayers = [...homePlayers, ...awayPlayers];

    for (const player of allPlayers) {
      const isWinner = (player.team_id === match.home_team_id && winnerTeamId === match.home_team_id) ||
                       (player.team_id === match.away_team_id && winnerTeamId === match.away_team_id);

      // Upsert player stats
      const existing = await prisma.playerStats.findUnique({
        where: { user_id_game_id: { user_id: player.user_id, game_id: gameId } }
      });

      if (existing) {
        const newWins = existing.wins + (isWinner ? 1 : 0);
        const newLosses = existing.losses + (isWinner ? 0 : 1);
        const totalMatches = existing.total_matches + 1;
        const winRate = totalMatches > 0 ? (newWins / totalMatches) * 100 : 0;

        // ELO-like rating adjustment
        const ratingChange = isWinner ? 25 : -20;

        await prisma.playerStats.update({
          where: { user_id_game_id: { user_id: player.user_id, game_id: gameId } },
          data: {
            total_matches: totalMatches,
            wins: newWins,
            losses: newLosses,
            win_rate: Math.round(winRate * 100) / 100,
            total_score: { increment: isWinner ? match.home_score + match.away_score : 0 },
            rating: Math.max(0, existing.rating + ratingChange),
            rank: getRank(Math.max(0, existing.rating + ratingChange))
          }
        });
      } else {
        await prisma.playerStats.create({
          data: {
            user_id: player.user_id,
            game_id: gameId,
            total_matches: 1,
            wins: isWinner ? 1 : 0,
            losses: isWinner ? 0 : 1,
            win_rate: isWinner ? 100 : 0,
            total_score: isWinner ? match.home_score + match.away_score : 0,
            rating: isWinner ? 1025 : 980,
            rank: isWinner ? 'Silver' : 'Bronze'
          }
        });
      }
    }

    console.log(`📊 Stats updated for match ${matchId}: ${allPlayers.length} players`);
  }
};

/**
 * Get rank name from ELO rating
 */
function getRank(rating: number): string {
  if (rating >= 2000) return 'Apex Predator';
  if (rating >= 1800) return 'Master';
  if (rating >= 1600) return 'Diamond';
  if (rating >= 1400) return 'Platinum';
  if (rating >= 1200) return 'Gold';
  if (rating >= 1000) return 'Silver';
  if (rating >= 800) return 'Bronze';
  return 'Rookie';
}
