/**
 * Seed script: 100 registros en la base de datos esposrt_tournament2100
 * 
 * Distribución de registros:
 * - 20 Users
 * - 5  Games
 * - 10 GameAccounts
 * - 8  Tournaments
 * - 16 Teams
 * - 16 TeamPlayers
 * - 10 Matches
 * - 5  Standings
 * - 5  PlayerStats
 * - 3  Clans
 * - 2  ClanMembers
 * Total: 100 registros
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const DATABASE_URL = 'mysql://root:@localhost:3306/esposrt_tournament2100';

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('🚀 Iniciando seed de 100 registros en esposrt_tournament2100...\n');

  // ========== 1. USERS (20) ==========
  console.log('👤 Creando 20 usuarios...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const usersData = [
    { email: 'admin@apex.com', username: 'AdminMaster', role: 'ADMIN' as const },
    { email: 'leader1@apex.com', username: 'LeaderAlpha', role: 'LEADER' as const },
    { email: 'leader2@apex.com', username: 'LeaderBeta', role: 'LEADER' as const },
    { email: 'player01@apex.com', username: 'ShadowHunter', role: 'USER' as const },
    { email: 'player02@apex.com', username: 'DragonSlayer', role: 'USER' as const },
    { email: 'player03@apex.com', username: 'NightWolf', role: 'USER' as const },
    { email: 'player04@apex.com', username: 'StormBreaker', role: 'USER' as const },
    { email: 'player05@apex.com', username: 'IronPhoenix', role: 'USER' as const },
    { email: 'player06@apex.com', username: 'CyberNinja', role: 'USER' as const },
    { email: 'player07@apex.com', username: 'FrostByte', role: 'USER' as const },
    { email: 'player08@apex.com', username: 'BlazeMaster', role: 'USER' as const },
    { email: 'player09@apex.com', username: 'VenomStrike', role: 'USER' as const },
    { email: 'player10@apex.com', username: 'ThunderBolt', role: 'USER' as const },
    { email: 'player11@apex.com', username: 'ArcticFury', role: 'USER' as const },
    { email: 'player12@apex.com', username: 'DarkVortex', role: 'USER' as const },
    { email: 'player13@apex.com', username: 'SolarFlare', role: 'USER' as const },
    { email: 'player14@apex.com', username: 'QuantumShift', role: 'USER' as const },
    { email: 'player15@apex.com', username: 'RogueAgent', role: 'USER' as const },
    { email: 'player16@apex.com', username: 'MysticBlade', role: 'USER' as const },
    { email: 'player17@apex.com', username: 'TitanForce', role: 'USER' as const },
  ];

  const users: any[] = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        username: u.username,
        password_hash: passwordHash,
        role: u.role,
        verified: true,
        description: `Jugador competitivo ${u.username}`,
      },
    });
    users.push(user);
  }
  console.log(`   ✅ ${users.length} usuarios creados`);

  // ========== 2. GAMES (5) ==========
  console.log('🎮 Creando 5 juegos...');
  const gamesData = [
    { name: 'Apex Legends', slug: 'apex-legends', developer: 'Respawn Entertainment', team_size_default: 3 },
    { name: 'League of Legends', slug: 'league-of-legends', developer: 'Riot Games', team_size_default: 5 },
    { name: 'Valorant', slug: 'valorant', developer: 'Riot Games', team_size_default: 5 },
    { name: 'Counter-Strike 2', slug: 'counter-strike-2', developer: 'Valve', team_size_default: 5 },
    { name: 'Clash Royale', slug: 'clash-royale', developer: 'Supercell', team_size_default: 1 },
  ];

  const games: any[] = [];
  for (const g of gamesData) {
    const game = await prisma.game.create({ data: g });
    games.push(game);
  }
  console.log(`   ✅ ${games.length} juegos creados`);

  // ========== 3. GAME ACCOUNTS (10) ==========
  console.log('🔗 Creando 10 cuentas de juego...');
  const gameAccountsData = [
    { user_idx: 3, game_idx: 0, game_username: 'ShadowHunter#1234', account_id: 'APEX-001', rank: 'Diamond' },
    { user_idx: 4, game_idx: 0, game_username: 'DragonSlayer#5678', account_id: 'APEX-002', rank: 'Master' },
    { user_idx: 5, game_idx: 1, game_username: 'NightWolf#9012', account_id: 'LOL-001', rank: 'Platinum' },
    { user_idx: 6, game_idx: 1, game_username: 'StormBreaker#3456', account_id: 'LOL-002', rank: 'Diamond' },
    { user_idx: 7, game_idx: 2, game_username: 'IronPhoenix#7890', account_id: 'VAL-001', rank: 'Ascendant' },
    { user_idx: 8, game_idx: 2, game_username: 'CyberNinja#2345', account_id: 'VAL-002', rank: 'Immortal' },
    { user_idx: 9, game_idx: 3, game_username: 'FrostByte#6789', account_id: 'CS2-001', rank: 'Global Elite' },
    { user_idx: 10, game_idx: 3, game_username: 'BlazeMaster#0123', account_id: 'CS2-002', rank: 'Supreme' },
    { user_idx: 11, game_idx: 4, game_username: 'VenomStrike#4567', account_id: 'CR-001', rank: 'Champion' },
    { user_idx: 12, game_idx: 4, game_username: 'ThunderBolt#8901', account_id: 'CR-002', rank: 'Grand Champion' },
  ];

  const gameAccounts: any[] = [];
  for (const ga of gameAccountsData) {
    const account = await prisma.gameAccount.create({
      data: {
        user_id: users[ga.user_idx].id,
        game_id: games[ga.game_idx].id,
        game_username: ga.game_username,
        account_id: ga.account_id,
        rank: ga.rank,
        verified: true,
        verified_at: new Date(),
      },
    });
    gameAccounts.push(account);
  }
  console.log(`   ✅ ${gameAccounts.length} cuentas de juego creadas`);

  // ========== 4. TOURNAMENTS (8) ==========
  console.log('🏆 Creando 8 torneos...');
  const now = new Date();
  const tournamentsData = [
    { name: 'Apex Masters Cup 2026', game_idx: 0, organizer_idx: 1, format: 'SINGLE_ELIMINATION' as const, team_size: 3, max_part: 16, region: 'LATAM', status: 'IN_PROGRESS' as const, days_offset: -5 },
    { name: 'LoL Champions Series MX', game_idx: 1, organizer_idx: 1, format: 'DOUBLE_ELIMINATION' as const, team_size: 5, max_part: 8, region: 'LATAM', status: 'REGISTRATION_OPEN' as const, days_offset: 10 },
    { name: 'Valorant Strike Open', game_idx: 2, organizer_idx: 2, format: 'SINGLE_ELIMINATION' as const, team_size: 5, max_part: 16, region: 'NA', status: 'PUBLISHED' as const, days_offset: 15 },
    { name: 'CS2 Global Challenge', game_idx: 3, organizer_idx: 2, format: 'SWISS' as const, team_size: 5, max_part: 16, region: 'EU', status: 'COMPLETED' as const, days_offset: -30 },
    { name: 'Clash Royale King Cup', game_idx: 4, organizer_idx: 1, format: 'SINGLE_ELIMINATION' as const, team_size: 1, max_part: 32, region: 'LATAM', status: 'REGISTRATION_OPEN' as const, days_offset: 7 },
    { name: 'Apex Predator League', game_idx: 0, organizer_idx: 2, format: 'ROUND_ROBIN' as const, team_size: 3, max_part: 8, region: 'NA', status: 'DRAFT' as const, days_offset: 20 },
    { name: 'Valorant Night Showdown', game_idx: 2, organizer_idx: 1, format: 'SINGLE_ELIMINATION' as const, team_size: 5, max_part: 8, region: 'LATAM', status: 'IN_PROGRESS' as const, days_offset: -2 },
    { name: 'LoL Copa Latinoamérica', game_idx: 1, organizer_idx: 2, format: 'DOUBLE_ELIMINATION' as const, team_size: 5, max_part: 16, region: 'LATAM', status: 'CANCELLED' as const, days_offset: -15 },
  ];

  const tournaments: any[] = [];
  for (const t of tournamentsData) {
    const startDate = new Date(now.getTime() + t.days_offset * 86400000);
    const regDeadline = new Date(startDate.getTime() - 2 * 86400000);
    const tournament = await prisma.tournament.create({
      data: {
        name: t.name,
        slug: slugify(t.name),
        description: `Torneo competitivo de ${gamesData[t.game_idx].name}. ¡Demuestra tu habilidad!`,
        game_id: games[t.game_idx].id,
        organizer_id: users[t.organizer_idx].id,
        format: t.format,
        team_size: t.team_size,
        max_participants: t.max_part,
        region: t.region,
        entry_fee: 0,
        prize_pool: Math.floor(Math.random() * 5000) + 500,
        start_date: startDate,
        end_date: new Date(startDate.getTime() + 3 * 86400000),
        registration_deadline: regDeadline,
        status: t.status,
        bracket_generated: t.status === 'IN_PROGRESS' || t.status === 'COMPLETED',
      },
    });
    tournaments.push(tournament);
  }
  console.log(`   ✅ ${tournaments.length} torneos creados`);

  // ========== 5. TEAMS (16) ==========
  console.log('👥 Creando 16 equipos...');
  const teamsPerTournament = [
    // Tournament 0 (Apex Masters Cup) - 4 teams
    { tournament_idx: 0, teams: [
      { name: 'Phoenix Rising', tag: 'PHX', captain_idx: 3 },
      { name: 'Shadow Wolves', tag: 'SHW', captain_idx: 6 },
      { name: 'Neon Vipers', tag: 'NEO', captain_idx: 9 },
      { name: 'Frost Legion', tag: 'FRT', captain_idx: 12 },
    ]},
    // Tournament 1 (LoL Champions) - 4 teams
    { tournament_idx: 1, teams: [
      { name: 'Dragon Knights', tag: 'DRK', captain_idx: 4 },
      { name: 'Storm Riders', tag: 'STR', captain_idx: 7 },
      { name: 'Mystic Lords', tag: 'MYS', captain_idx: 10 },
      { name: 'Inferno Squad', tag: 'INF', captain_idx: 13 },
    ]},
    // Tournament 2 (Valorant Strike) - 4 teams
    { tournament_idx: 2, teams: [
      { name: 'Cyber Phantoms', tag: 'CPH', captain_idx: 5 },
      { name: 'Iron Wolves', tag: 'IRW', captain_idx: 8 },
      { name: 'Dark Matter', tag: 'DKM', captain_idx: 11 },
      { name: 'Quantum Force', tag: 'QTF', captain_idx: 14 },
    ]},
    // Tournament 3 (CS2 Global) - 4 teams
    { tournament_idx: 3, teams: [
      { name: 'Titan Squad', tag: 'TTN', captain_idx: 15 },
      { name: 'Blaze Corps', tag: 'BLZ', captain_idx: 16 },
      { name: 'Arctic Aces', tag: 'ACE', captain_idx: 17 },
      { name: 'Venom Elite', tag: 'VNM', captain_idx: 18 },
    ]},
  ];

  const teams: any[] = [];
  for (const tpt of teamsPerTournament) {
    for (const teamData of tpt.teams) {
      const team = await prisma.team.create({
        data: {
          tournament_id: tournaments[tpt.tournament_idx].id,
          name: teamData.name,
          tag: teamData.tag,
          captain_id: users[teamData.captain_idx].id,
          seed: teams.filter(t => t.tournament_id === tournaments[tpt.tournament_idx].id).length + 1,
          approved: true,
        },
      });
      teams.push(team);
    }
  }
  console.log(`   ✅ ${teams.length} equipos creados`);

  // ========== 6. TEAM PLAYERS (16) ==========
  console.log('🎯 Creando 16 jugadores de equipo...');
  // Each captain is automatically a team player
  const teamPlayers: any[] = [];
  for (let i = 0; i < teams.length; i++) {
    const captainIdx = teamsPerTournament[Math.floor(i / 4)].teams[i % 4].captain_idx;
    const tp = await prisma.teamPlayer.create({
      data: {
        team_id: teams[i].id,
        user_id: users[captainIdx].id,
        role: 'Captain',
        is_captain: true,
        status: 'ACTIVE',
      },
    });
    teamPlayers.push(tp);
  }
  console.log(`   ✅ ${teamPlayers.length} jugadores de equipo creados`);

  // ========== 7. MATCHES (10) ==========
  console.log('⚔️ Creando 10 partidos...');
  const matchesData = [
    // Tournament 0 - Semifinales y final
    { tournament_idx: 0, round: 1, match_num: 1, bracket_pos: 1, home_team_local: 0, away_team_local: 1, status: 'COMPLETED' as const, home_score: 2, away_score: 1, winner_local: 0 },
    { tournament_idx: 0, round: 1, match_num: 2, bracket_pos: 2, home_team_local: 2, away_team_local: 3, status: 'COMPLETED' as const, home_score: 0, away_score: 2, winner_local: 3 },
    { tournament_idx: 0, round: 2, match_num: 1, bracket_pos: 3, home_team_local: 0, away_team_local: 3, status: 'LIVE' as const, home_score: 1, away_score: 1, winner_local: null },
    // Tournament 3 - Completed tournament
    { tournament_idx: 3, round: 1, match_num: 1, bracket_pos: 1, home_team_local: 0, away_team_local: 1, status: 'COMPLETED' as const, home_score: 2, away_score: 0, winner_local: 0 },
    { tournament_idx: 3, round: 1, match_num: 2, bracket_pos: 2, home_team_local: 2, away_team_local: 3, status: 'COMPLETED' as const, home_score: 1, away_score: 2, winner_local: 3 },
    { tournament_idx: 3, round: 2, match_num: 1, bracket_pos: 3, home_team_local: 0, away_team_local: 3, status: 'COMPLETED' as const, home_score: 2, away_score: 1, winner_local: 0 },
    // Additional matches for other tournaments
    { tournament_idx: 1, round: 1, match_num: 1, bracket_pos: 1, home_team_local: 0, away_team_local: 1, status: 'SCHEDULED' as const, home_score: 0, away_score: 0, winner_local: null },
    { tournament_idx: 1, round: 1, match_num: 2, bracket_pos: 2, home_team_local: 2, away_team_local: 3, status: 'SCHEDULED' as const, home_score: 0, away_score: 0, winner_local: null },
    { tournament_idx: 2, round: 1, match_num: 1, bracket_pos: 1, home_team_local: 0, away_team_local: 1, status: 'SCHEDULED' as const, home_score: 0, away_score: 0, winner_local: null },
    { tournament_idx: 2, round: 1, match_num: 2, bracket_pos: 2, home_team_local: 2, away_team_local: 3, status: 'SCHEDULED' as const, home_score: 0, away_score: 0, winner_local: null },
  ];

  const matches: any[] = [];
  for (const m of matchesData) {
    const tournamentTeams = teams.filter(t => t.tournament_id === tournaments[m.tournament_idx].id);
    const match = await prisma.match.create({
      data: {
        tournament_id: tournaments[m.tournament_idx].id,
        round: m.round,
        match_number: m.match_num,
        bracket_position: m.bracket_pos,
        home_team_id: tournamentTeams[m.home_team_local].id,
        away_team_id: tournamentTeams[m.away_team_local].id,
        scheduled_datetime: new Date(now.getTime() + (m.tournament_idx - 1) * 86400000),
        best_of: 3,
        status: m.status,
        home_score: m.home_score,
        away_score: m.away_score,
        winner_id: m.winner_local !== null ? tournamentTeams[m.winner_local].id : null,
      },
    });
    matches.push(match);
  }
  console.log(`   ✅ ${matches.length} partidos creados`);

  // ========== 8. STANDINGS (5) ==========
  console.log('📊 Creando 5 standings...');
  // Standings for completed tournament (tournament 3 - CS2 Global)
  const t3Teams = teams.filter(t => t.tournament_id === tournaments[3].id);
  const standingsData = [
    { team: t3Teams[0], played: 3, won: 3, lost: 0, points: 9, position: 1 },
    { team: t3Teams[3], played: 3, won: 2, lost: 1, points: 6, position: 2 },
    { team: t3Teams[2], played: 3, won: 1, lost: 2, points: 3, position: 3 },
    { team: t3Teams[1], played: 3, won: 0, lost: 3, points: 0, position: 4 },
  ];

  const standings: any[] = [];
  for (const s of standingsData) {
    const standing = await prisma.standing.create({
      data: {
        tournament_id: tournaments[3].id,
        team_id: s.team.id,
        played: s.played,
        won: s.won,
        lost: s.lost,
        rounds_for: s.won * 2,
        rounds_against: s.lost,
        points: s.points,
        position: s.position,
      },
    });
    standings.push(standing);
  }
  // One more standing for tournament 0
  const t0Teams = teams.filter(t => t.tournament_id === tournaments[0].id);
  const standing5 = await prisma.standing.create({
    data: {
      tournament_id: tournaments[0].id,
      team_id: t0Teams[0].id,
      played: 1,
      won: 1,
      lost: 0,
      rounds_for: 2,
      rounds_against: 1,
      points: 3,
      position: 1,
    },
  });
  standings.push(standing5);
  console.log(`   ✅ ${standings.length} standings creados`);

  // ========== 9. PLAYER STATS (5) ==========
  console.log('📈 Creando 5 estadísticas de jugadores...');
  const playerStatsData = [
    { user_idx: 3, game_idx: 0, matches: 45, wins: 30, losses: 15, rating: 1850 },
    { user_idx: 4, game_idx: 1, matches: 62, wins: 40, losses: 22, rating: 2100 },
    { user_idx: 5, game_idx: 2, matches: 38, wins: 22, losses: 16, rating: 1650 },
    { user_idx: 8, game_idx: 2, matches: 55, wins: 35, losses: 20, rating: 1920 },
    { user_idx: 9, game_idx: 3, matches: 70, wins: 50, losses: 20, rating: 2300 },
  ];

  const playerStats: any[] = [];
  for (const ps of playerStatsData) {
    const stat = await prisma.playerStats.create({
      data: {
        user_id: users[ps.user_idx].id,
        game_id: games[ps.game_idx].id,
        total_matches: ps.matches,
        wins: ps.wins,
        losses: ps.losses,
        draws: 0,
        win_rate: parseFloat((ps.wins / ps.matches * 100).toFixed(2)),
        total_score: ps.wins * 25,
        average_score: parseFloat((ps.wins * 25 / ps.matches).toFixed(2)),
        rating: ps.rating,
      },
    });
    playerStats.push(stat);
  }
  console.log(`   ✅ ${playerStats.length} estadísticas de jugadores creadas`);

  // ========== 10. CLANS (3) ==========
  console.log('🛡️ Creando 3 clanes...');
  const clansData = [
    { name: 'Los Inmortales', tag: 'IMT', description: 'Clan competitivo de alto nivel en LATAM', leader_idx: 3, access: 'OPEN' as const, max_members: 30 },
    { name: 'Shadow Empire', tag: 'SHE', description: 'Elite gaming clan focused on CS2 and Valorant', leader_idx: 7, access: 'INVITE_ONLY' as const, max_members: 25 },
    { name: 'Neon Dynasty', tag: 'NDY', description: 'Comunidad de gamers apasionados por los esports', leader_idx: 15, access: 'OPEN' as const, max_members: 50 },
  ];

  const clans: any[] = [];
  for (const c of clansData) {
    const clan = await prisma.clan.create({
      data: {
        name: c.name,
        tag: c.tag,
        description: c.description,
        leader_id: users[c.leader_idx].id,
        access_type: c.access,
        max_members: c.max_members,
        location: 'Latinoamérica',
      },
    });
    clans.push(clan);
  }
  console.log(`   ✅ ${clans.length} clanes creados`);

  // ========== 11. CLAN MEMBERS (2) ==========
  console.log('🤝 Creando 2 miembros de clan...');
  const clanMembers: any[] = [];

  const cm1 = await prisma.clanMember.create({
    data: {
      clan_id: clans[0].id,
      user_id: users[4].id,
      role: 'OFFICER',
    },
  });
  clanMembers.push(cm1);

  const cm2 = await prisma.clanMember.create({
    data: {
      clan_id: clans[1].id,
      user_id: users[8].id,
      role: 'MEMBER',
    },
  });
  clanMembers.push(cm2);
  console.log(`   ✅ ${clanMembers.length} miembros de clan creados`);

  // ========== RESUMEN ==========
  const totalRecords =
    users.length +
    games.length +
    gameAccounts.length +
    tournaments.length +
    teams.length +
    teamPlayers.length +
    matches.length +
    standings.length +
    playerStats.length +
    clans.length +
    clanMembers.length;

  console.log('\n========================================');
  console.log('📋 RESUMEN DE REGISTROS CREADOS:');
  console.log('========================================');
  console.log(`   👤 Users:          ${users.length}`);
  console.log(`   🎮 Games:          ${games.length}`);
  console.log(`   🔗 GameAccounts:   ${gameAccounts.length}`);
  console.log(`   🏆 Tournaments:    ${tournaments.length}`);
  console.log(`   👥 Teams:          ${teams.length}`);
  console.log(`   🎯 TeamPlayers:    ${teamPlayers.length}`);
  console.log(`   ⚔️  Matches:        ${matches.length}`);
  console.log(`   📊 Standings:      ${standings.length}`);
  console.log(`   📈 PlayerStats:    ${playerStats.length}`);
  console.log(`   🛡️  Clans:          ${clans.length}`);
  console.log(`   🤝 ClanMembers:    ${clanMembers.length}`);
  console.log('========================================');
  console.log(`   📦 TOTAL:          ${totalRecords} registros`);
  console.log('========================================');
  console.log('\n✅ Seed completado exitosamente en esposrt_tournament2100!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
