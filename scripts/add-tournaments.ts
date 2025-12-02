import { PrismaClient, TournamentFormat, TournamentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function addTournaments() {
  console.log('🏆 Añadiendo torneos...\n');

  // Obtener juegos y organizador
  const games = await prisma.game.findMany();
  const organizer = await prisma.user.findFirst({ where: { role: 'ORGANIZER' } });

  if (!organizer) {
    console.error('❌ No hay organizadores disponibles');
    return;
  }

  const gameMap: Record<string, string> = {};
  games.forEach(g => {
    gameMap[g.slug] = g.id;
  });

  // Torneos a crear
  const tournaments: Array<{
    name: string;
    slug: string;
    description: string;
    game_id: string | undefined;
    format: TournamentFormat;
    team_size: number;
    max_participants: number;
    region: string;
    entry_fee: number;
    prize_pool: number;
    start_date: Date;
    registration_deadline: Date;
    status: TournamentStatus;
  }> = [
    // League of Legends
    {
      name: 'LEC Spring Split 2025',
      slug: 'lec-spring-2025',
      description: 'La liga europea de League of Legends, donde los mejores equipos compiten por el título.',
      game_id: gameMap['lol'],
      format: 'ROUND_ROBIN' as TournamentFormat,
      team_size: 5,
      max_participants: 10,
      region: 'EU',
      entry_fee: 0,
      prize_pool: 200000,
      start_date: new Date('2025-01-15'),
      registration_deadline: new Date('2025-01-10'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    },
    {
      name: 'LCS Summer 2025',
      slug: 'lcs-summer-2025',
      description: 'Liga de Campeones de Norte América - Summer Split',
      game_id: gameMap['lol'],
      format: 'DOUBLE_ELIMINATION' as TournamentFormat,
      team_size: 5,
      max_participants: 8,
      region: 'NA',
      entry_fee: 0,
      prize_pool: 150000,
      start_date: new Date('2025-06-01'),
      registration_deadline: new Date('2025-05-25'),
      status: 'DRAFT' as TournamentStatus
    },
    {
      name: 'LATAM League Open',
      slug: 'latam-league-open',
      description: 'Torneo abierto para equipos de Latinoamérica',
      game_id: gameMap['lol'],
      format: 'SINGLE_ELIMINATION' as TournamentFormat,
      team_size: 5,
      max_participants: 32,
      region: 'LATAM',
      entry_fee: 50,
      prize_pool: 10000,
      start_date: new Date('2025-02-20'),
      registration_deadline: new Date('2025-02-15'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    },

    // Valorant
    {
      name: 'VCT Americas 2025',
      slug: 'vct-americas-2025',
      description: 'Valorant Champions Tour - Liga de las Américas',
      game_id: gameMap['valorant'],
      format: 'ROUND_ROBIN' as TournamentFormat,
      team_size: 5,
      max_participants: 12,
      region: 'NA',
      entry_fee: 0,
      prize_pool: 500000,
      start_date: new Date('2025-02-01'),
      registration_deadline: new Date('2025-01-20'),
      status: 'IN_PROGRESS' as TournamentStatus
    },
    {
      name: 'Valorant Radiant Cup',
      slug: 'valorant-radiant-cup',
      description: 'Copa exclusiva para jugadores Radiant y profesionales',
      game_id: gameMap['valorant'],
      format: 'SINGLE_ELIMINATION' as TournamentFormat,
      team_size: 5,
      max_participants: 16,
      region: 'GLOBAL',
      entry_fee: 100,
      prize_pool: 25000,
      start_date: new Date('2025-03-10'),
      registration_deadline: new Date('2025-03-05'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    },
    {
      name: 'VCT Game Changers LATAM',
      slug: 'vct-gc-latam',
      description: 'Torneo femenino de Valorant para Latinoamérica',
      game_id: gameMap['valorant'],
      format: 'DOUBLE_ELIMINATION' as TournamentFormat,
      team_size: 5,
      max_participants: 8,
      region: 'LATAM',
      entry_fee: 0,
      prize_pool: 15000,
      start_date: new Date('2025-04-01'),
      registration_deadline: new Date('2025-03-25'),
      status: 'DRAFT' as TournamentStatus
    },

    // Counter-Strike 2
    {
      name: 'IEM Katowice 2025',
      slug: 'iem-katowice-2025',
      description: 'Intel Extreme Masters - El torneo más prestigioso de CS2',
      game_id: gameMap['cs2'],
      format: 'DOUBLE_ELIMINATION' as TournamentFormat,
      team_size: 5,
      max_participants: 24,
      region: 'GLOBAL',
      entry_fee: 0,
      prize_pool: 1000000,
      start_date: new Date('2025-02-15'),
      registration_deadline: new Date('2025-01-30'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    },
    {
      name: 'BLAST Premier Spring',
      slug: 'blast-premier-spring',
      description: 'BLAST Premier Spring Finals 2025',
      game_id: gameMap['cs2'],
      format: 'SINGLE_ELIMINATION' as TournamentFormat,
      team_size: 5,
      max_participants: 8,
      region: 'EU',
      entry_fee: 0,
      prize_pool: 425000,
      start_date: new Date('2025-03-20'),
      registration_deadline: new Date('2025-03-10'),
      status: 'DRAFT' as TournamentStatus
    },
    {
      name: 'CS2 Open Qualifier LATAM',
      slug: 'cs2-open-latam',
      description: 'Clasificatorio abierto para torneos mayores',
      game_id: gameMap['cs2'],
      format: 'SINGLE_ELIMINATION' as TournamentFormat,
      team_size: 5,
      max_participants: 64,
      region: 'LATAM',
      entry_fee: 25,
      prize_pool: 5000,
      start_date: new Date('2025-01-25'),
      registration_deadline: new Date('2025-01-20'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    },

    // EA Sports FC 25
    {
      name: 'FIFAe World Cup 2025',
      slug: 'fifae-world-cup-2025',
      description: 'El campeonato mundial de EA Sports FC',
      game_id: gameMap['fc25'],
      format: 'DOUBLE_ELIMINATION' as TournamentFormat,
      team_size: 1,
      max_participants: 32,
      region: 'GLOBAL',
      entry_fee: 0,
      prize_pool: 500000,
      start_date: new Date('2025-07-01'),
      registration_deadline: new Date('2025-06-15'),
      status: 'DRAFT' as TournamentStatus
    },
    {
      name: 'eLaLiga FC Pro',
      slug: 'elaliga-fc-pro',
      description: 'Liga profesional española de EA Sports FC',
      game_id: gameMap['fc25'],
      format: 'ROUND_ROBIN' as TournamentFormat,
      team_size: 1,
      max_participants: 20,
      region: 'EU',
      entry_fee: 0,
      prize_pool: 100000,
      start_date: new Date('2025-02-01'),
      registration_deadline: new Date('2025-01-25'),
      status: 'IN_PROGRESS' as TournamentStatus
    },
    {
      name: 'FC 25 Weekend League Finals',
      slug: 'fc25-weekend-finals',
      description: 'Finales del Weekend League - Solo para Elite',
      game_id: gameMap['fc25'],
      format: 'SINGLE_ELIMINATION' as TournamentFormat,
      team_size: 1,
      max_participants: 16,
      region: 'LATAM',
      entry_fee: 20,
      prize_pool: 2000,
      start_date: new Date('2025-01-18'),
      registration_deadline: new Date('2025-01-15'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    },

    // Rocket League
    {
      name: 'RLCS World Championship 2025',
      slug: 'rlcs-worlds-2025',
      description: 'Campeonato Mundial de Rocket League Championship Series',
      game_id: gameMap['rocket-league'],
      format: 'DOUBLE_ELIMINATION' as TournamentFormat,
      team_size: 3,
      max_participants: 16,
      region: 'GLOBAL',
      entry_fee: 0,
      prize_pool: 2000000,
      start_date: new Date('2025-08-01'),
      registration_deadline: new Date('2025-07-15'),
      status: 'DRAFT' as TournamentStatus
    },
    {
      name: 'RLCS NA Regional',
      slug: 'rlcs-na-regional',
      description: 'Regional de Norteamérica - Clasificatorio al Mundial',
      game_id: gameMap['rocket-league'],
      format: 'SWISS' as TournamentFormat,
      team_size: 3,
      max_participants: 16,
      region: 'NA',
      entry_fee: 0,
      prize_pool: 100000,
      start_date: new Date('2025-03-01'),
      registration_deadline: new Date('2025-02-20'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    },
    {
      name: 'Rocket League 3v3 Open',
      slug: 'rl-3v3-open',
      description: 'Torneo abierto para todos los rangos',
      game_id: gameMap['rocket-league'],
      format: 'SINGLE_ELIMINATION' as TournamentFormat,
      team_size: 3,
      max_participants: 32,
      region: 'LATAM',
      entry_fee: 10,
      prize_pool: 1500,
      start_date: new Date('2025-01-22'),
      registration_deadline: new Date('2025-01-18'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    },

    // Clash Royale
    {
      name: 'Clash Royale League World Finals',
      slug: 'crl-world-finals',
      description: 'Finales mundiales de la Clash Royale League',
      game_id: gameMap['clash-royale'],
      format: 'DOUBLE_ELIMINATION' as TournamentFormat,
      team_size: 1,
      max_participants: 16,
      region: 'GLOBAL',
      entry_fee: 0,
      prize_pool: 1000000,
      start_date: new Date('2025-12-01'),
      registration_deadline: new Date('2025-11-15'),
      status: 'DRAFT' as TournamentStatus
    },
    {
      name: 'CRL LATAM 2025',
      slug: 'crl-latam-2025',
      description: 'Liga Latinoamericana de Clash Royale',
      game_id: gameMap['clash-royale'],
      format: 'ROUND_ROBIN' as TournamentFormat,
      team_size: 1,
      max_participants: 12,
      region: 'LATAM',
      entry_fee: 0,
      prize_pool: 50000,
      start_date: new Date('2025-02-10'),
      registration_deadline: new Date('2025-02-01'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    },
    {
      name: 'Clash Royale Open Cup',
      slug: 'cr-open-cup',
      description: 'Copa abierta mensual de Clash Royale',
      game_id: gameMap['clash-royale'],
      format: 'SINGLE_ELIMINATION' as TournamentFormat,
      team_size: 1,
      max_participants: 64,
      region: 'GLOBAL',
      entry_fee: 5,
      prize_pool: 500,
      start_date: new Date('2025-01-20'),
      registration_deadline: new Date('2025-01-17'),
      status: 'REGISTRATION_OPEN' as TournamentStatus
    }
  ];

  let created = 0;
  let skipped = 0;

  for (const tournament of tournaments) {
    if (!tournament.game_id) {
      console.log(`⚠️ Saltando torneo "${tournament.name}" - Juego no encontrado`);
      skipped++;
      continue;
    }

    try {
      // Verificar si ya existe
      const existing = await prisma.tournament.findUnique({
        where: { slug: tournament.slug }
      });

      if (existing) {
        console.log(`⏭️ Torneo "${tournament.name}" ya existe`);
        skipped++;
        continue;
      }

      await prisma.tournament.create({
        data: {
          ...tournament,
          game_id: tournament.game_id!,
          organizer_id: organizer.id
        }
      });

      console.log(`✅ Creado: ${tournament.name}`);
      created++;
    } catch (error: any) {
      console.error(`❌ Error creando "${tournament.name}":`, error.message);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Creados: ${created}`);
  console.log(`   ⏭️ Saltados: ${skipped}`);
}

addTournaments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
