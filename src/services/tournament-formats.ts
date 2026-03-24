import { prisma } from '../config/database';

/**
 * =====================================================
 * TOURNAMENT FORMAT ENGINES
 * =====================================================
 * 
 * Double Elimination, Round Robin, Swiss
 */

// ============================================================
// DOUBLE ELIMINATION
// ============================================================

export async function generateDoubleEliminationBracket(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { teams: { where: { approved: true, disqualified: false }, orderBy: { registration_date: 'asc' } } }
  });

  if (!tournament) throw new Error('Torneo no encontrado');
  if (tournament.bracket_generated) throw new Error('El bracket ya fue generado');

  const teams = tournament.teams;
  if (teams.length < 2) throw new Error('Se necesitan al menos 2 equipos');

  // Assign seeds
  for (let i = 0; i < teams.length; i++) {
    await prisma.team.update({ where: { id: teams[i].id }, data: { seed: i + 1 } });
    teams[i].seed = i + 1;
  }

  const bracketSize = nextPowerOf2(teams.length);
  const winnersRounds = Math.log2(bracketSize);
  const losersRounds = (winnersRounds - 1) * 2; // Losers bracket has ~2x rounds
  const matchesCreated: any[] = [];
  let matchNumber = 0;

  // --- Winners Bracket ---
  for (let round = 1; round <= winnersRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    for (let pos = 0; pos < matchesInRound; pos++) {
      matchNumber++;
      const seedOrder = generateSeedOrder(bracketSize);

      let homeTeamId: string | null = null;
      let awayTeamId: string | null = null;

      if (round === 1) {
        const homeSlot = seedOrder[pos * 2] <= teams.length ? teams.find(t => t.seed === seedOrder[pos * 2]) : null;
        const awaySlot = seedOrder[pos * 2 + 1] <= teams.length ? teams.find(t => t.seed === seedOrder[pos * 2 + 1]) : null;
        homeTeamId = homeSlot?.id || null;
        awayTeamId = awaySlot?.id || null;
      }

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
      matchesCreated.push({ ...match, bracket: 'winners' });
    }
  }

  // --- Losers Bracket ---
  for (let round = 1; round <= losersRounds; round++) {
    const matchesInRound = Math.max(1, bracketSize / Math.pow(2, Math.ceil(round / 2) + 1));
    for (let pos = 0; pos < matchesInRound; pos++) {
      matchNumber++;
      const match = await prisma.match.create({
        data: {
          tournament_id: tournamentId,
          round: winnersRounds + round, // Offset rounds
          match_number: matchNumber,
          bracket_position: pos + 1,
          status: 'SCHEDULED',
          best_of: 1,
        }
      });
      matchesCreated.push({ ...match, bracket: 'losers' });
    }
  }

  // --- Grand Final ---
  matchNumber++;
  const grandFinal = await prisma.match.create({
    data: {
      tournament_id: tournamentId,
      round: winnersRounds + losersRounds + 1,
      match_number: matchNumber,
      bracket_position: 1,
      status: 'SCHEDULED',
      best_of: 3,
    }
  });
  matchesCreated.push({ ...grandFinal, bracket: 'grand_final' });

  // Handle BYEs in round 1
  const round1 = matchesCreated.filter(m => m.round === 1);
  for (const match of round1) {
    const hasHome = !!match.home_team_id;
    const hasAway = !!match.away_team_id;
    if (hasHome && !hasAway) {
      await prisma.match.update({
        where: { id: match.id },
        data: { winner_id: match.home_team_id, status: 'COMPLETED', home_score: 1, away_score: 0 }
      });
    } else if (!hasHome && hasAway) {
      await prisma.match.update({
        where: { id: match.id },
        data: { winner_id: match.away_team_id, status: 'COMPLETED', home_score: 0, away_score: 1 }
      });
    }
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { bracket_generated: true, status: 'IN_PROGRESS' }
  });

  return {
    tournament_id: tournamentId,
    format: 'DOUBLE_ELIMINATION',
    total_teams: teams.length,
    bracket_size: bracketSize,
    winners_rounds: winnersRounds,
    losers_rounds: losersRounds,
    total_matches: matchesCreated.length,
  };
}

// ============================================================
// ROUND ROBIN
// ============================================================

export async function generateRoundRobinSchedule(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { teams: { where: { approved: true, disqualified: false }, orderBy: { registration_date: 'asc' } } }
  });

  if (!tournament) throw new Error('Torneo no encontrado');
  if (tournament.bracket_generated) throw new Error('El schedule ya fue generado');

  const teams = tournament.teams;
  if (teams.length < 2) throw new Error('Se necesitan al menos 2 equipos');

  // Assign seeds
  for (let i = 0; i < teams.length; i++) {
    await prisma.team.update({ where: { id: teams[i].id }, data: { seed: i + 1 } });
  }

  // Round Robin: every team plays every other team once
  // Using circle method for scheduling
  const n = teams.length;
  const totalRounds = n % 2 === 0 ? n - 1 : n;
  const teamsArr = [...teams];

  // If odd number of teams, add a "bye" placeholder
  if (n % 2 !== 0) {
    teamsArr.push(null as any);
  }

  const halfSize = teamsArr.length / 2;
  let matchNumber = 0;
  const matchesCreated: any[] = [];

  // Initialize standings for each team
  for (const team of teams) {
    await prisma.standing.upsert({
      where: { tournament_id_team_id: { tournament_id: tournamentId, team_id: team.id } },
      update: {},
      create: {
        tournament_id: tournamentId,
        team_id: team.id,
        position: 0,
        points: 0
      }
    });
  }

  for (let round = 1; round <= totalRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const home = teamsArr[i];
      const away = teamsArr[teamsArr.length - 1 - i];

      if (!home || !away) continue; // BYE

      matchNumber++;
      const match = await prisma.match.create({
        data: {
          tournament_id: tournamentId,
          round,
          match_number: matchNumber,
          bracket_position: i + 1,
          home_team_id: home.id,
          away_team_id: away.id,
          status: 'SCHEDULED',
          best_of: 1,
        }
      });
      matchesCreated.push(match);
    }

    // Rotate teams (keep first team fixed, rotate rest)
    const last = teamsArr.pop()!;
    teamsArr.splice(1, 0, last);
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { bracket_generated: true, status: 'IN_PROGRESS' }
  });

  return {
    tournament_id: tournamentId,
    format: 'ROUND_ROBIN',
    total_teams: teams.length,
    total_rounds: totalRounds,
    total_matches: matchesCreated.length,
  };
}

/**
 * Report result for Round Robin — updates standings
 */
export async function reportRoundRobinResult(matchId: string, winnerId: string, homeScore: number, awayScore: number) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true }
  });

  if (!match) throw new Error('Partido no encontrado');
  if (match.status === 'COMPLETED') throw new Error('Partido ya completado');

  const isDraw = homeScore === awayScore;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      winner_id: isDraw ? null : winnerId,
      home_score: homeScore,
      away_score: awayScore,
      status: 'COMPLETED'
    }
  });

  // Update standings
  if (match.home_team_id) {
    const homeWon = winnerId === match.home_team_id;
    await prisma.standing.update({
      where: { tournament_id_team_id: { tournament_id: match.tournament_id, team_id: match.home_team_id } },
      data: {
        played: { increment: 1 },
        won: { increment: homeWon ? 1 : 0 },
        lost: { increment: !homeWon && !isDraw ? 1 : 0 },
        drawn: { increment: isDraw ? 1 : 0 },
        rounds_for: { increment: homeScore },
        rounds_against: { increment: awayScore },
        points: { increment: homeWon ? 3 : isDraw ? 1 : 0 }
      }
    });
  }

  if (match.away_team_id) {
    const awayWon = winnerId === match.away_team_id;
    await prisma.standing.update({
      where: { tournament_id_team_id: { tournament_id: match.tournament_id, team_id: match.away_team_id } },
      data: {
        played: { increment: 1 },
        won: { increment: awayWon ? 1 : 0 },
        lost: { increment: !awayWon && !isDraw ? 1 : 0 },
        drawn: { increment: isDraw ? 1 : 0 },
        rounds_for: { increment: awayScore },
        rounds_against: { increment: homeScore },
        points: { increment: awayWon ? 3 : isDraw ? 1 : 0 }
      }
    });
  }

  // Recalculate positions
  const standings = await prisma.standing.findMany({
    where: { tournament_id: match.tournament_id },
    orderBy: [{ points: 'desc' }, { rounds_for: 'desc' }]
  });

  for (let i = 0; i < standings.length; i++) {
    await prisma.standing.update({
      where: { id: standings[i].id },
      data: { position: i + 1 }
    });
  }

  // Check if tournament is complete
  const remainingMatches = await prisma.match.count({
    where: { tournament_id: match.tournament_id, status: { not: 'COMPLETED' } }
  });

  if (remainingMatches === 0) {
    await prisma.tournament.update({
      where: { id: match.tournament_id },
      data: { status: 'COMPLETED' }
    });
  }

  return { success: true, match_id: matchId };
}

// ============================================================
// SWISS
// ============================================================

export async function generateSwissRound(tournamentId: string, roundNumber: number) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { teams: { where: { approved: true, disqualified: false } } }
  });

  if (!tournament) throw new Error('Torneo no encontrado');

  const teams = tournament.teams;
  if (teams.length < 2) throw new Error('Se necesitan al menos 2 equipos');

  if (roundNumber === 1) {
    // First round: init standings and generate bracket
    for (let i = 0; i < teams.length; i++) {
      await prisma.team.update({ where: { id: teams[i].id }, data: { seed: i + 1 } });
      await prisma.standing.upsert({
        where: { tournament_id_team_id: { tournament_id: tournamentId, team_id: teams[i].id } },
        update: {},
        create: { tournament_id: tournamentId, team_id: teams[i].id, position: 0, points: 0 }
      });
    }

    if (!tournament.bracket_generated) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { bracket_generated: true, status: 'IN_PROGRESS' }
      });
    }
  }

  // Get current standings sorted by points (for pairing)
  const standings = await prisma.standing.findMany({
    where: { tournament_id: tournamentId },
    orderBy: [{ points: 'desc' }, { rounds_for: 'desc' }],
    include: { team: true }
  });

  // Get previously played matches to avoid rematches
  const playedMatches = await prisma.match.findMany({
    where: { tournament_id: tournamentId, status: 'COMPLETED' }
  });

  const playedPairs = new Set(
    playedMatches.map(m => [m.home_team_id, m.away_team_id].sort().join('-'))
  );

  // Swiss pairing: match teams with similar scores, avoiding rematches
  const paired: string[] = [];
  const matchesCreated: any[] = [];
  let matchNumber = playedMatches.length;

  for (let i = 0; i < standings.length; i++) {
    if (paired.includes(standings[i].team_id)) continue;

    for (let j = i + 1; j < standings.length; j++) {
      if (paired.includes(standings[j].team_id)) continue;

      const pairKey = [standings[i].team_id, standings[j].team_id].sort().join('-');
      if (playedPairs.has(pairKey)) continue;

      // Found a valid pair
      matchNumber++;
      const match = await prisma.match.create({
        data: {
          tournament_id: tournamentId,
          round: roundNumber,
          match_number: matchNumber,
          bracket_position: Math.floor(matchesCreated.length / 2) + 1,
          home_team_id: standings[i].team_id,
          away_team_id: standings[j].team_id,
          status: 'SCHEDULED',
          best_of: 1,
        }
      });

      paired.push(standings[i].team_id, standings[j].team_id);
      matchesCreated.push(match);
      break;
    }
  }

  // Recommended number of Swiss rounds: ceil(log2(teamCount))
  const recommendedRounds = Math.ceil(Math.log2(teams.length));

  return {
    tournament_id: tournamentId,
    format: 'SWISS',
    round: roundNumber,
    recommended_total_rounds: recommendedRounds,
    matches_created: matchesCreated.length,
    teams_with_bye: standings.length - paired.length
  };
}

// ============================================================
// HELPERS
// ============================================================

function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

function generateSeedOrder(bracketSize: number): number[] {
  if (bracketSize === 2) return [1, 2];
  const halfOrder = generateSeedOrder(bracketSize / 2);
  const fullOrder: number[] = [];
  for (const seed of halfOrder) {
    fullOrder.push(seed);
    fullOrder.push(bracketSize + 1 - seed);
  }
  return fullOrder;
}
