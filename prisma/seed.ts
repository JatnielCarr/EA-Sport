import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const organizerPassword = await bcrypt.hash('organizer123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create games
  console.log('🎮 Creating games...');
  const lol = await prisma.game.upsert({
    where: { slug: 'lol' },
    update: {},
    create: {
      name: 'League of Legends',
      slug: 'lol',
      developer: 'Riot Games',
      icon_url: 'https://example.com/lol-icon.png',
      team_size_default: 5,
    },
  });

  const valorant = await prisma.game.upsert({
    where: { slug: 'valorant' },
    update: {},
    create: {
      name: 'Valorant',
      slug: 'valorant',
      developer: 'Riot Games',
      icon_url: 'https://example.com/valorant-icon.png',
      team_size_default: 5,
    },
  });

  const cs2 = await prisma.game.upsert({
    where: { slug: 'cs2' },
    update: {},
    create: {
      name: 'Counter-Strike 2',
      slug: 'cs2',
      developer: 'Valve',
      icon_url: 'https://example.com/cs2-icon.png',
      team_size_default: 5,
    },
  });

  const fc25 = await prisma.game.upsert({
    where: { slug: 'fc25' },
    update: {},
    create: {
      name: 'EA Sports FC 25',
      slug: 'fc25',
      developer: 'EA Sports',
      icon_url: 'https://example.com/fc25-icon.png',
      team_size_default: 1,
    },
  });

  const rocketLeague = await prisma.game.upsert({
    where: { slug: 'rocket-league' },
    update: {},
    create: {
      name: 'Rocket League',
      slug: 'rocket-league',
      developer: 'Psyonix',
      icon_url: 'https://example.com/rocket-icon.png',
      team_size_default: 3,
    },
  });

  const clashRoyale = await prisma.game.upsert({
    where: { slug: 'clash-royale' },
    update: {},
    create: {
      name: 'Clash Royale',
      slug: 'clash-royale',
      developer: 'Supercell',
      icon_url: 'https://example.com/clash-royale-icon.png',
      team_size_default: 1,
    },
  });

  console.log('✅ Games created');

  // Create users
  console.log('👥 Creating users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@easports.com' },
    update: { password_hash: adminPassword },
    create: {
      email: 'admin@easports.com',
      username: 'Admin',
      password_hash: adminPassword,
      role: 'ADMIN',
      verified: true,
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@easports.com' },
    update: { password_hash: organizerPassword },
    create: {
      email: 'organizer@easports.com',
      username: 'Organizer',
      password_hash: organizerPassword,
      role: 'ORGANIZER',
      verified: true,
    },
  });

  // Create 8 players
  const players = [];
  for (let i = 1; i <= 8; i++) {
    const player = await prisma.user.upsert({
      where: { email: `player${i}@easports.com` },
      update: { password_hash: userPassword },
      create: {
        email: `player${i}@easports.com`,
        username: `Player${i}`,
        password_hash: userPassword,
        role: 'USER',
        verified: true,
      },
    });
    players.push(player);
  }

  console.log('✅ Users created');

  // Create tournaments
  console.log('🏆 Creating tournaments...');
  const tournament1 = await prisma.tournament.upsert({
    where: { slug: 'lol-winter-2025' },
    update: {},
    create: {
      name: 'League of Legends Winter Championship 2025',
      slug: 'lol-winter-2025',
      description: 'Campeonato de invierno de League of Legends con los mejores equipos de la región.',
      game_id: lol.id,
      organizer_id: organizer.id,
      format: 'SINGLE_ELIMINATION',
      team_size: 5,
      max_participants: 8,
      region: 'EU',
      entry_fee: 50,
      prize_pool: 10000,
      start_date: new Date('2025-12-15T18:00:00Z'),
      registration_deadline: new Date('2025-12-10T23:59:59Z'),
      status: 'REGISTRATION_OPEN',
    },
  });

  const tournament2 = await prisma.tournament.upsert({
    where: { slug: 'valorant-pro-series' },
    update: {},
    create: {
      name: 'Valorant Pro Series',
      slug: 'valorant-pro-series',
      description: 'Serie profesional de Valorant con formato suizo.',
      game_id: valorant.id,
      organizer_id: organizer.id,
      format: 'SWISS',
      team_size: 5,
      max_participants: 16,
      region: 'NA',
      entry_fee: 25,
      prize_pool: 5000,
      start_date: new Date('2025-12-20T20:00:00Z'),
      registration_deadline: new Date('2025-12-18T23:59:59Z'),
      status: 'PUBLISHED',
    },
  });

  const tournament3 = await prisma.tournament.upsert({
    where: { slug: 'cs2-masters' },
    update: {},
    create: {
      name: 'CS2 Masters Tournament',
      slug: 'cs2-masters',
      description: 'Torneo maestro de Counter-Strike 2 con doble eliminación.',
      game_id: cs2.id,
      organizer_id: admin.id,
      format: 'DOUBLE_ELIMINATION',
      team_size: 5,
      max_participants: 32,
      region: 'GLOBAL',
      entry_fee: 100,
      prize_pool: 25000,
      start_date: new Date('2026-01-10T16:00:00Z'),
      registration_deadline: new Date('2026-01-05T23:59:59Z'),
      status: 'DRAFT',
    },
  });

  console.log('✅ Tournaments created');

  // Create teams
  console.log('👥 Creating teams...');
  const team1 = await prisma.team.upsert({
    where: { tournament_id_name: { tournament_id: tournament1.id, name: 'Dragon Esports' } },
    update: {},
    create: {
      tournament_id: tournament1.id,
      name: 'Dragon Esports',
      tag: 'DRG',
      captain_id: players[0].id,
      seed: 1,
      payment_status: 'PAID',
      approved: true,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { tournament_id_name: { tournament_id: tournament1.id, name: 'Night Wolves' } },
    update: {},
    create: {
      tournament_id: tournament1.id,
      name: 'Night Wolves',
      tag: 'NW',
      captain_id: players[2].id,
      seed: 2,
      payment_status: 'PAID',
      approved: true,
    },
  });

  const team3 = await prisma.team.upsert({
    where: { tournament_id_name: { tournament_id: tournament1.id, name: 'Phoenix Rising' } },
    update: {},
    create: {
      tournament_id: tournament1.id,
      name: 'Phoenix Rising',
      tag: 'PHX',
      captain_id: players[4].id,
      seed: 3,
      payment_status: 'PAID',
      approved: true,
    },
  });

  const team4 = await prisma.team.upsert({
    where: { tournament_id_name: { tournament_id: tournament1.id, name: 'Storm Riders' } },
    update: {},
    create: {
      tournament_id: tournament1.id,
      name: 'Storm Riders',
      tag: 'STR',
      captain_id: players[6].id,
      seed: 4,
      payment_status: 'PAID',
      approved: true,
    },
  });

  const teams = [team1, team2, team3, team4];
  console.log('✅ Teams created');

  // Add players to teams
  console.log('👤 Adding players to teams...');
  const teamPlayersData = [
    { team_id: team1.id, user_id: players[0].id, role: 'Top', is_captain: true },
    { team_id: team1.id, user_id: players[1].id, role: 'Jungle', is_captain: false },
    { team_id: team2.id, user_id: players[2].id, role: 'Mid', is_captain: true },
    { team_id: team2.id, user_id: players[3].id, role: 'ADC', is_captain: false },
    { team_id: team3.id, user_id: players[4].id, role: 'Support', is_captain: true },
    { team_id: team3.id, user_id: players[5].id, role: 'Top', is_captain: false },
    { team_id: team4.id, user_id: players[6].id, role: 'Jungle', is_captain: true },
    { team_id: team4.id, user_id: players[7].id, role: 'Mid', is_captain: false },
  ];

  for (const tp of teamPlayersData) {
    await prisma.teamPlayer.upsert({
      where: { team_id_user_id: { team_id: tp.team_id, user_id: tp.user_id } },
      update: {},
      create: tp,
    });
  }
  console.log('✅ Team players added');

  // Create matches
  console.log('⚔️ Creating matches...');
  await prisma.match.deleteMany({ where: { tournament_id: tournament1.id } });
  
  await prisma.match.create({
    data: {
      tournament_id: tournament1.id,
      round: 1,
      match_number: 1,
      bracket_position: 1,
      home_team_id: team1.id,
      away_team_id: team4.id,
      scheduled_datetime: new Date('2025-12-15T18:00:00Z'),
      best_of: 3,
      status: 'SCHEDULED',
    },
  });

  await prisma.match.create({
    data: {
      tournament_id: tournament1.id,
      round: 1,
      match_number: 2,
      bracket_position: 2,
      home_team_id: team2.id,
      away_team_id: team3.id,
      scheduled_datetime: new Date('2025-12-15T20:00:00Z'),
      best_of: 3,
      status: 'SCHEDULED',
    },
  });

  await prisma.match.create({
    data: {
      tournament_id: tournament1.id,
      round: 2,
      match_number: 1,
      bracket_position: 1,
      scheduled_datetime: new Date('2025-12-16T18:00:00Z'),
      best_of: 5,
      status: 'SCHEDULED',
    },
  });

  console.log('✅ Matches created');

  // Create standings
  console.log('📊 Creating standings...');
  await prisma.standing.deleteMany({ where: { tournament_id: tournament1.id } });
  
  for (let i = 0; i < teams.length; i++) {
    await prisma.standing.create({
      data: {
        tournament_id: tournament1.id,
        team_id: teams[i].id,
        position: i + 1,
      },
    });
  }
  console.log('✅ Standings created');

  // Create player stats
  console.log('📈 Creating player stats...');
  for (let i = 0; i < 4; i++) {
    await prisma.playerStats.upsert({
      where: { user_id_game_id: { user_id: players[i].id, game_id: lol.id } },
      update: {},
      create: {
        user_id: players[i].id,
        game_id: lol.id,
        total_matches: 100 + i * 20,
        wins: 60 + i * 10,
        losses: 40 + i * 10,
        win_rate: 60 + i * 2,
        rating: 1500 + i * 100,
      },
    });
  }
  console.log('✅ Player stats created');

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   - Games: 5');
  console.log('   - Users: 10');
  console.log('   - Tournaments: 3');
  console.log('   - Teams: 4');
  console.log('   - Matches: 3');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });