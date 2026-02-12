import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const organizerPassword = await bcrypt.hash('organizer123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // ==========================================
  // 1. Create Games
  // ==========================================
  console.log('🎮 Creating games...');
  const lol = await prisma.game.upsert({
    where: { slug: 'lol' },
    update: {},
    create: { name: 'League of Legends', slug: 'lol', developer: 'Riot Games', team_size_default: 5 },
  });

  const valorant = await prisma.game.upsert({
    where: { slug: 'valorant' },
    update: {},
    create: { name: 'Valorant', slug: 'valorant', developer: 'Riot Games', team_size_default: 5 },
  });

  const cs2 = await prisma.game.upsert({
    where: { slug: 'cs2' },
    update: {},
    create: { name: 'Counter-Strike 2', slug: 'cs2', developer: 'Valve', team_size_default: 5 },
  });

  const fc25 = await prisma.game.upsert({
    where: { slug: 'fc25' },
    update: {},
    create: { name: 'EA Sports FC 25', slug: 'fc25', developer: 'EA Sports', team_size_default: 1 },
  });

  const rocket = await prisma.game.upsert({
    where: { slug: 'rocket-league' },
    update: {},
    create: { name: 'Rocket League', slug: 'rocket-league', developer: 'Psyonix', team_size_default: 3 },
  });

  console.log('✅ 5 Games created');

  // ==========================================
  // 2. Create Users (Massive)
  // ==========================================
  console.log('👥 Creating 50+ users...');

  // Core users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@easports.com' },
    update: { password_hash: adminPassword },
    create: { email: 'admin@easports.com', username: 'Admin', password_hash: adminPassword, role: 'ADMIN', verified: true },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@easports.com' },
    update: { password_hash: organizerPassword },
    create: { email: 'organizer@easports.com', username: 'Organizer', password_hash: organizerPassword, role: 'ORGANIZER', verified: true },
  });

  // Generate 50 Players
  const players = [];
  const playerNames = [
    'Faker', 'S1mple', 'ZywOo', 'Niko', 'Caps', 'Rekkles', 'Perkz', 'ShowMaker', 'Chovy', 'Canyon',
    'TenZ', 'Yay', 'Derke', 'Boaster', 'ScreaM', 'Nats', 'Chronicle', 'Leo', 'Alfajer', 'Demon1',
    'M0nesy', 'Ropz', 'Twistzz', 'Broky', 'Karrigan', 'Electronic', 'Perfecto', 'Sh1ro', 'Ax1Le', 'H1bbit',
    'Techno', 'Ninja', 'Shroud', 'Tfue', 'Symfuhny', 'Nickmercs', 'TimTheTatman', 'DrDisrespect', 'Summit1g', 'Lirik',
    'XQc', 'KaiCenat', 'IShowSpeed', 'AdinRoss', 'Clix', 'Bugha', 'Mongraal', 'Benjyfishy', 'Savage', 'EpikWhale'
  ];

  for (let i = 0; i < 50; i++) {
    const name = playerNames[i] || `Player${i + 1}`;
    const player = await prisma.user.upsert({
      where: { email: `player${i + 1}@easports.com` },
      update: { password_hash: userPassword },
      create: {
        email: `player${i + 1}@easports.com`,
        username: name,
        password_hash: userPassword,
        role: 'USER',
        verified: Math.random() > 0.7, // 30% verified
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        description: 'Pro player aspiring to reach the top. #GrindNeverStops',
      },
    });
    players.push(player);
  }
  console.log(`✅ ${players.length + 2} Users created`);

  // ==========================================
  // 3. Create Clans
  // ==========================================
  console.log('🛡️ Creating clans...');
  const clanNames = [
    { name: 'Elite Warriors', tag: 'ELT' },
    { name: 'Shadow Gaming', tag: 'SDW' },
    { name: 'Team Liquid', tag: 'TL' },
    { name: 'Cloud9', tag: 'C9' },
    { name: 'G2 Esports', tag: 'G2' },
    { name: 'Fnatic', tag: 'FNC' },
    { name: 'Sentinels', tag: 'SEN' },
    { name: 'T1', tag: 'T1' },
    { name: 'FaZe Clan', tag: 'FAZE' },
    { name: '100 Thieves', tag: '100T' }
  ];

  for (let i = 0; i < clanNames.length; i++) {
    const leader = players[i * 5]; // Assign a unique leader
    if (!leader) continue;

    const clan = await prisma.clan.upsert({
      where: { name: clanNames[i].name },
      update: {},
      create: {
        name: clanNames[i].name,
        tag: clanNames[i].tag,
        leader_id: leader.id,
        description: `Official clan for ${clanNames[i].name}. Recruitng top talent.`,
        access_type: i % 2 === 0 ? 'OPEN' : 'INVITE_ONLY',
        max_members: 50,
      },
    });

    // Add leader as member
    await prisma.clanMember.upsert({
      where: { clan_id_user_id: { clan_id: clan.id, user_id: leader.id } },
      update: {},
      create: { clan_id: clan.id, user_id: leader.id, role: 'LEADER' },
    });

    // Add 4 members to each clan
    for (let j = 1; j <= 4; j++) {
      const member = players[i * 5 + j];
      if (member) {
        await prisma.clanMember.upsert({
          where: { clan_id_user_id: { clan_id: clan.id, user_id: member.id } },
          update: {},
          create: { clan_id: clan.id, user_id: member.id, role: 'MEMBER' },
        });
      }
    }
  }
  console.log('✅ Clans created');

  // ==========================================
  // 4. Create Tournaments (Live & History)
  // ==========================================
  console.log('🏆 Creating detailed tournaments...');

  // --- A. LIVE TOURNAMENT (In Progress) ---
  const liveTournament = await prisma.tournament.upsert({
    where: { slug: 'fc25-weekend-live' },
    update: {},
    create: {
      name: 'FC 25 Weekend League LIVE',
      slug: 'fc25-weekend-live',
      description: 'Torneo en vivo de fin de semana. ¡Sigue la acción!',
      game_id: fc25.id,
      organizer_id: organizer.id,
      format: 'SINGLE_ELIMINATION',
      team_size: 1,
      max_participants: 16,
      region: 'GLOBAL',
      entry_fee: 100,
      prize_pool: 25000,
      start_date: new Date(Date.now() - 3600000), // Started 1 hour ago
      end_date: new Date(Date.now() + 86400000),
      registration_deadline: new Date(Date.now() - 86400000),
      status: 'IN_PROGRESS',
    },
  });

  // Clean up existing data for this tournament to avoid collisions
  await prisma.standing.deleteMany({ where: { tournament_id: liveTournament.id } });
  await prisma.match.deleteMany({ where: { tournament_id: liveTournament.id } });
  await prisma.team.deleteMany({ where: { tournament_id: liveTournament.id } });

  // Create teams for Live Tournament (16 teams)
  const liveTeams = [];
  for (let i = 0; i < 16; i++) {
    const player = players[i];
    const team = await prisma.team.upsert({
      where: { tournament_id_name: { tournament_id: liveTournament.id, name: `Team ${player.username}` } },
      update: {},
      create: {
        tournament_id: liveTournament.id,
        name: `Team ${player.username}`,
        tag: (player.username.substring(0, 3) + Math.floor(Math.random() * 999)).toUpperCase(),
        captain_id: player.id,
        approved: true,
        seed: i + 1,
      },
    });
    liveTeams.push(team);
  }

  // Create LIVE Matches
  // await prisma.match.deleteMany({ where: { tournament_id: liveTournament.id } }); // Already deleted above

  // 2 Live matches
  for (let i = 0; i < 2; i++) {
    await prisma.match.create({
      data: {
        tournament_id: liveTournament.id,
        round: 1,
        match_number: i + 1,
        bracket_position: i + 1,
        status: 'LIVE',
        home_team_id: liveTeams[i * 2].id,
        away_team_id: liveTeams[i * 2 + 1].id,
        home_score: Math.floor(Math.random() * 3),
        away_score: Math.floor(Math.random() * 3),
        best_of: 3,
        scheduled_datetime: new Date(Date.now() - 1800000), // Started 30 mins ago
      }
    });
  }

  // --- B. UPCOMING TOURNAMENT ---
  await prisma.tournament.upsert({
    where: { slug: 'valorant-community-cup' },
    update: {},
    create: {
      name: 'Valorant Community Cup',
      slug: 'valorant-community-cup',
      description: 'Torneo abierto para la comunidad. ¡Inscríbete ya!',
      game_id: valorant.id,
      organizer_id: organizer.id,
      format: 'SINGLE_ELIMINATION',
      team_size: 5,
      max_participants: 32,
      region: 'NA',
      entry_fee: 0,
      prize_pool: 5000,
      start_date: new Date(Date.now() + 604800000), // In 1 week
      registration_deadline: new Date(Date.now() + 500000000),
      status: 'REGISTRATION_OPEN',
    },
  });

  // --- C. COMPLETED TOURNAMENT (History) ---
  const completedTournament = await prisma.tournament.upsert({
    where: { slug: 'lol-winter-championship' },
    update: {},
    create: {
      name: 'LoL Winter Championship 2024',
      slug: 'lol-winter-championship',
      description: 'El evento más grande del invierno pasado.',
      game_id: lol.id,
      organizer_id: admin.id,
      format: 'SINGLE_ELIMINATION',
      team_size: 5,
      max_participants: 8,
      region: 'EU',
      entry_fee: 500,
      prize_pool: 100000,
      start_date: new Date('2024-12-01'),
      end_date: new Date('2024-12-03'),
      registration_deadline: new Date('2024-11-25'),
      status: 'COMPLETED',
    },
  });

  console.log('✅ Tournaments created');

  // ==========================================
  // 5. Generate Stats for Rankings
  // ==========================================
  console.log('📈 Generating rankings...');

  // Clear old stats
  await prisma.playerStats.deleteMany({});

  for (const p of players) {
    // Stats for LoL
    await prisma.playerStats.create({
      data: {
        user_id: p.id,
        game_id: lol.id,
        total_matches: Math.floor(Math.random() * 500),
        wins: Math.floor(Math.random() * 300),
        losses: Math.floor(Math.random() * 200),
        win_rate: 45 + Math.random() * 15, // 45-60% WR
        rating: 1200 + Math.floor(Math.random() * 1800), // 1200-3000 rating
        rank: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'][Math.floor(Math.random() * 10)],
      }
    });

    // Stats for FC25
    await prisma.playerStats.create({
      data: {
        user_id: p.id,
        game_id: fc25.id,
        total_matches: Math.floor(Math.random() * 200),
        wins: Math.floor(Math.random() * 100),
        losses: Math.floor(Math.random() * 100),
        win_rate: 40 + Math.random() * 20,
        rating: 400 + Math.floor(Math.random() * 600),
        rank: `Div ${Math.floor(Math.random() * 10) + 1}`,
      }
    });
  }
  console.log('✅ Rankings generated');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });