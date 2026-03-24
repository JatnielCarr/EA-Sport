import { prisma } from '../config/database';
import { revenueService } from './revenue.service';
import { playerStatsService } from './player-stats.service';

/**
 * Tournament Engine — Bracket Generation & Match Result Handling
 * 
 * Provides fair seeding and automatic winner advancement for
 * single-elimination tournament brackets.
 */

// ============================================================
// BRACKET GENERATION
// ============================================================

/**
 * Generate a single-elimination bracket for a tournament.
 * 
 * Algorithm:
 * 1. Fetch approved, non-disqualified teams
 * 2. Assign seeds (1..N) based on registration order
 * 3. Pad to next power of 2 with BYEs (null team slots)
 * 4. Use standard seeding layout: Seed 1 vs Seed N, Seed 2 vs N-1, etc.
 * 5. Create Match records for ALL rounds (R1 through Final)
 * 6. Auto-advance teams that face a BYE
 */
export async function generateBracket(tournamentId: string) {
    // 1. Validate tournament
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { teams: { where: { approved: true, disqualified: false }, orderBy: { registration_date: 'asc' } } }
    });

    if (!tournament) {
        throw new Error('Torneo no encontrado');
    }

    if (tournament.bracket_generated) {
        throw new Error('El bracket ya fue generado para este torneo');
    }

    const teams = tournament.teams;

    if (teams.length < 2) {
        throw new Error('Se necesitan al menos 2 equipos aprobados para generar el bracket');
    }

    // 2. Assign seeds
    for (let i = 0; i < teams.length; i++) {
        await prisma.team.update({
            where: { id: teams[i].id },
            data: { seed: i + 1 }
        });
        teams[i].seed = i + 1;
    }

    // 3. Calculate bracket size (next power of 2)
    const bracketSize = nextPowerOf2(teams.length);
    const totalRounds = Math.log2(bracketSize);

    // 4. Generate seeded positions
    //    Standard seeding: [1, N, N/2+1, N/2, N/4+1, 3*N/4, ...]
    //    This ensures Seed 1 vs Seed N, Seed 2 vs N-1 at opposite ends
    const seedOrder = generateSeedOrder(bracketSize);

    // Map seeds to teams (null = BYE)
    const slots: (typeof teams[0] | null)[] = seedOrder.map(seed => {
        return teams.find(t => t.seed === seed) || null;
    });

    // 5. Create all matches for all rounds
    const matchesCreated: any[] = [];

    for (let round = 1; round <= totalRounds; round++) {
        const matchesInRound = bracketSize / Math.pow(2, round);

        for (let pos = 0; pos < matchesInRound; pos++) {
            const matchNumber = matchesCreated.length + 1;

            let homeTeamId: string | null = null;
            let awayTeamId: string | null = null;

            if (round === 1) {
                // Round 1: assign teams from seeded slots
                const homeSlot = slots[pos * 2];
                const awaySlot = slots[pos * 2 + 1];
                homeTeamId = homeSlot?.id || null;
                awayTeamId = awaySlot?.id || null;
            }
            // Later rounds start empty — filled by reportResult()

            const match = await prisma.match.create({
                data: {
                    tournament_id: tournamentId,
                    round,
                    match_number: matchNumber,
                    bracket_position: pos + 1,
                    home_team_id: homeTeamId,
                    away_team_id: awayTeamId,
                    status: 'SCHEDULED',
                    best_of: 1,
                }
            });

            matchesCreated.push(match);
        }
    }

    // 6. Auto-advance BYEs in Round 1
    //    If a match has one team and one BYE, the team automatically wins
    const round1Matches = matchesCreated.filter(m => m.round === 1);

    for (const match of round1Matches) {
        const hasHome = !!match.home_team_id;
        const hasAway = !!match.away_team_id;

        if (hasHome && !hasAway) {
            // Home team gets a BYE — auto-advance
            await advanceWinner(match.id, match.home_team_id, matchesCreated);
        } else if (!hasHome && hasAway) {
            // Away team gets a BYE — auto-advance
            await advanceWinner(match.id, match.away_team_id, matchesCreated);
        }
        // If both present: normal match. If both null: shouldn't happen with valid bracket.
    }

    // 7. Mark tournament
    await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
            bracket_generated: true,
            status: 'IN_PROGRESS'
        }
    });

    // Return the full bracket
    const bracket = await prisma.match.findMany({
        where: { tournament_id: tournamentId },
        include: { home_team: true, away_team: true, winner: true },
        orderBy: [{ round: 'asc' }, { bracket_position: 'asc' }]
    });

    return {
        tournament_id: tournamentId,
        total_teams: teams.length,
        bracket_size: bracketSize,
        total_rounds: totalRounds,
        total_matches: matchesCreated.length,
        matches: bracket
    };
}


// ============================================================
// REPORT RESULT & ADVANCE WINNER
// ============================================================

/**
 * Report the result of a match and advance the winner to the next round.
 */
export async function reportResult(
    matchId: string,
    winnerId: string,
    homeScore: number,
    awayScore: number
) {
    // 1. Validate match
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { tournament: true, home_team: true, away_team: true }
    });

    if (!match) {
        throw new Error('Partido no encontrado');
    }

    if (match.status === 'COMPLETED') {
        throw new Error('Este partido ya tiene un resultado registrado');
    }

    if (!match.home_team_id || !match.away_team_id) {
        throw new Error('Este partido aún no tiene ambos equipos asignados');
    }

    // Validate winner is one of the two teams
    if (winnerId !== match.home_team_id && winnerId !== match.away_team_id) {
        throw new Error('El ganador debe ser uno de los dos equipos del partido');
    }

    // Validate scores make sense
    if (homeScore < 0 || awayScore < 0) {
        throw new Error('Los marcadores no pueden ser negativos');
    }

    // 2. Update match with result
    await prisma.match.update({
        where: { id: matchId },
        data: {
            winner_id: winnerId,
            home_score: homeScore,
            away_score: awayScore,
            status: 'COMPLETED'
        }
    });

    // 3. Get all matches in this tournament to find the next round match
    const allMatches = await prisma.match.findMany({
        where: { tournament_id: match.tournament_id },
        orderBy: [{ round: 'asc' }, { bracket_position: 'asc' }]
    });

    // 4. Advance winner to next round
    await advanceWinner(matchId, winnerId, allMatches);

    // 5. Check if this was the final match (last round)
    const maxRound = Math.max(...allMatches.map(m => m.round));
    if (match.round === maxRound) {
        // This was the final — mark tournament as COMPLETED
        await prisma.tournament.update({
            where: { id: match.tournament_id },
            data: { status: 'COMPLETED' }
        });

        // === AUTO-DISTRIBUTE PRIZES ===
        const prizePool = Number(match.tournament.prize_pool) || 0;
        if (prizePool > 0) {
            try {
                // Get winning team with captain
                const winningTeam = await prisma.team.findUnique({
                    where: { id: winnerId },
                    include: { captain: true }
                });

                // Get runner-up (loser of the final)
                const loserId = winnerId === match.home_team_id ? match.away_team_id : match.home_team_id;
                const runnerUpTeam = loserId ? await prisma.team.findUnique({
                    where: { id: loserId },
                    include: { captain: true }
                }) : null;

                // Prize distribution: 1st place = 70%, 2nd place = 30%
                const firstPrize = prizePool * 0.70;
                const secondPrize = prizePool * 0.30;

                // Credit 1st place (winner)
                if (winningTeam?.captain_id) {
                    await revenueService.creditPrizeToWallet(
                        winningTeam.captain_id,
                        match.tournament_id,
                        winnerId,
                        1,
                        firstPrize
                    );
                    console.log(`🏆 1er lugar: $${firstPrize} → ${winningTeam.captain?.username || winningTeam.captain_id}`);
                }

                // Credit 2nd place (runner-up)
                if (runnerUpTeam?.captain_id) {
                    await revenueService.creditPrizeToWallet(
                        runnerUpTeam.captain_id,
                        match.tournament_id,
                        loserId!,
                        2,
                        secondPrize
                    );
                    console.log(`🥈 2do lugar: $${secondPrize} → ${runnerUpTeam.captain?.username || runnerUpTeam.captain_id}`);
                }

                console.log(`✅ Premios distribuidos para torneo ${match.tournament.name || match.tournament_id}`);
            } catch (prizeError) {
                console.error('❌ Error distribuyendo premios:', prizeError);
                // Don't fail the match result — prizes can be distributed manually
            }
        }
    }

    // 6. Update player stats
    try {
        await playerStatsService.updateAfterMatch(matchId);
    } catch (statsErr) {
        console.error('Error updating player stats:', statsErr);
    }

    // 7. Return updated bracket
    const updatedMatch = await prisma.match.findUnique({
        where: { id: matchId },
        include: { home_team: true, away_team: true, winner: true }
    });

    return {
        match: updatedMatch,
        winner_advanced: match.round < maxRound,
        tournament_completed: match.round === maxRound
    };
}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Advance the winner of a match into the correct slot in the next round.
 * 
 * Logic: Each match at bracket_position P in round R feeds into
 * bracket_position ceil(P/2) in round R+1.
 * If P is odd → home_team slot; if P is even → away_team slot.
 */
async function advanceWinner(
    matchId: string,
    winnerId: string,
    allMatches: any[]
) {
    const match = allMatches.find(m => m.id === matchId);
    if (!match) return;

    const currentRound = match.round;
    const currentPos = match.bracket_position;

    // Find the corresponding match in the next round
    const nextRound = currentRound + 1;
    const nextPos = Math.ceil(currentPos / 2);

    const nextMatch = allMatches.find(
        m => m.round === nextRound && m.bracket_position === nextPos
    );

    if (!nextMatch) {
        // No next match — this was the final
        return;
    }

    // Determine slot: odd positions go to home, even go to away
    const isHomeSlot = currentPos % 2 === 1;

    if (isHomeSlot) {
        await prisma.match.update({
            where: { id: nextMatch.id },
            data: { home_team_id: winnerId }
        });
    } else {
        await prisma.match.update({
            where: { id: nextMatch.id },
            data: { away_team_id: winnerId }
        });
    }

    // Update the match as COMPLETED (for BYE auto-advances)
    if (match.status !== 'COMPLETED') {
        await prisma.match.update({
            where: { id: matchId },
            data: {
                winner_id: winnerId,
                status: 'COMPLETED',
                home_score: 0,
                away_score: 0
            }
        });
    }

    // Check if the next match now has both teams and one is null (another BYE chain)
    const updatedNextMatch = await prisma.match.findUnique({
        where: { id: nextMatch.id }
    });

    if (updatedNextMatch) {
        // If the next match already had one team from a previous BYE advance,
        // and now both slots are filled, it's ready to play (stays SCHEDULED).
        // But if one slot is still null and won't be filled (all slots should be filled
        // via BYE advancement), no further action needed here.
    }
}

/**
 * Returns the next power of 2 >= n.
 */
function nextPowerOf2(n: number): number {
    let power = 1;
    while (power < n) {
        power *= 2;
    }
    return power;
}

/**
 * Generate standard tournament seed order for a given bracket size.
 * 
 * For size 8: [1, 8, 4, 5, 2, 7, 3, 6]
 * This ensures:
 * - Match 1: Seed 1 vs Seed 8
 * - Match 2: Seed 4 vs Seed 5
 * - Match 3: Seed 2 vs Seed 7
 * - Match 4: Seed 3 vs Seed 6
 * 
 * Seeds 1 and 2 are placed at opposite ends and can only meet in the Final.
 */
function generateSeedOrder(bracketSize: number): number[] {
    // Base case: size 2
    if (bracketSize === 2) {
        return [1, 2];
    }

    // Recursive: build from smaller bracket
    const halfOrder = generateSeedOrder(bracketSize / 2);

    const fullOrder: number[] = [];
    for (const seed of halfOrder) {
        // Each seed from the half bracket maps to a pair in the full bracket:
        // seed and (bracketSize + 1 - seed)
        fullOrder.push(seed);
        fullOrder.push(bracketSize + 1 - seed);
    }

    return fullOrder;
}
