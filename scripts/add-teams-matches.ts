import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTeamsAndMatches() {
  console.log('🏆 Añadiendo equipos y partidas...\n');

  // Obtener usuarios (para capitanes)
  const users = await prisma.user.findMany();
  const userIds = users.map(u => u.id);

  // Obtener torneos activos (IN_PROGRESS o REGISTRATION_OPEN)
  const tournaments = await prisma.tournament.findMany({
    where: {
      status: {
        in: ['IN_PROGRESS', 'REGISTRATION_OPEN']
      }
    },
    include: {
      game: true
    }
  });

  console.log(`📋 Encontrados ${tournaments.length} torneos activos\n`);

  // Equipos profesionales por juego
  const teamsByGame: Record<string, Array<{ name: string; tag: string }>> = {
    'lol': [
      { name: 'T1', tag: 'T1' },
      { name: 'Gen.G Esports', tag: 'GEN' },
      { name: 'G2 Esports', tag: 'G2' },
      { name: 'Fnatic', tag: 'FNC' },
      { name: 'Cloud9', tag: 'C9' },
      { name: 'Team Liquid', tag: 'TL' },
      { name: 'MAD Lions', tag: 'MAD' },
      { name: 'Rogue', tag: 'RGE' },
      { name: 'LOUD', tag: 'LLL' },
      { name: 'Estral Esports', tag: 'EST' }
    ],
    'valorant': [
      { name: 'Sentinels', tag: 'SEN' },
      { name: 'LOUD', tag: 'LOUD' },
      { name: 'Fnatic', tag: 'FNC' },
      { name: 'Paper Rex', tag: 'PRX' },
      { name: 'DRX', tag: 'DRX' },
      { name: 'NRG Esports', tag: 'NRG' },
      { name: 'Evil Geniuses', tag: 'EG' },
      { name: '100 Thieves', tag: '100T' },
      { name: 'KRÜ Esports', tag: 'KRU' },
      { name: 'Leviatán', tag: 'LEV' }
    ],
    'cs2': [
      { name: 'FaZe Clan', tag: 'FAZE' },
      { name: 'Natus Vincere', tag: 'NAVI' },
      { name: 'Team Vitality', tag: 'VIT' },
      { name: 'G2 Esports', tag: 'G2' },
      { name: 'Heroic', tag: 'HRC' },
      { name: 'MOUZ', tag: 'MOUZ' },
      { name: 'Team Spirit', tag: 'SPR' },
      { name: 'Cloud9', tag: 'C9' },
      { name: 'FURIA Esports', tag: 'FUR' },
      { name: '9z Team', tag: '9Z' }
    ],
    'fc25': [
      { name: 'Team Gullit', tag: 'TG' },
      { name: 'Complexity', tag: 'COL' },
      { name: 'DUX Gaming', tag: 'DUX' },
      { name: 'TG.NIP', tag: 'NIP' },
      { name: 'Fnatic', tag: 'FNC' },
      { name: 'Rebels Gaming', tag: 'RBL' },
      { name: 'Team Heretics', tag: 'TH' },
      { name: 'Giants Gaming', tag: 'GIA' }
    ],
    'rocket-league': [
      { name: 'Team BDS', tag: 'BDS' },
      { name: 'Karmine Corp', tag: 'KC' },
      { name: 'G2 Esports', tag: 'G2' },
      { name: 'NRG Esports', tag: 'NRG' },
      { name: 'Gen.G Mobil1', tag: 'GEN' },
      { name: 'FURIA Esports', tag: 'FUR' },
      { name: 'Spacestation', tag: 'SSG' },
      { name: 'Oxygen Esports', tag: 'OXG' }
    ],
    'clash-royale': [
      { name: 'SK Gaming', tag: 'SK' },
      { name: 'Team Queso', tag: 'TQ' },
      { name: 'Misfits Gaming', tag: 'MSF' },
      { name: 'INTZ', tag: 'INTZ' },
      { name: 'Nova Esports', tag: 'NOV' },
      { name: 'FAV Gaming', tag: 'FAV' },
      { name: 'W Esports', tag: 'WES' },
      { name: 'Cream Real Betis', tag: 'CRB' }
    ]
  };

  let teamsCreated = 0;
  let matchesCreated = 0;
  const createdTeamsByTournament: Record<string, string[]> = {};

  // Crear equipos para cada torneo
  for (const tournament of tournaments) {
    const gameSlug = tournament.game.slug;
    const teams = teamsByGame[gameSlug] || [];
    
    if (teams.length === 0) {
      console.log(`⚠️ No hay equipos predefinidos para ${tournament.game.name}`);
      continue;
    }

    console.log(`\n🎮 ${tournament.name} (${tournament.game.name})`);
    createdTeamsByTournament[tournament.id] = [];

    // Crear equipos (máximo según max_participants del torneo)
    const maxTeams = Math.min(teams.length, tournament.max_participants);
    
    for (let i = 0; i < maxTeams; i++) {
      const teamData = teams[i];
      const captainId = userIds[i % userIds.length];

      try {
        // Verificar si ya existe
        const existing = await prisma.team.findFirst({
          where: {
            tournament_id: tournament.id,
            name: teamData.name
          }
        });

        if (existing) {
          console.log(`   ⏭️ Equipo ${teamData.name} ya existe`);
          createdTeamsByTournament[tournament.id].push(existing.id);
          continue;
        }

        const team = await prisma.team.create({
          data: {
            tournament_id: tournament.id,
            name: teamData.name,
            tag: teamData.tag,
            captain_id: captainId,
            approved: true
          }
        });

        createdTeamsByTournament[tournament.id].push(team.id);
        console.log(`   ✅ Creado equipo: ${teamData.name} [${teamData.tag}]`);
        teamsCreated++;
      } catch (error: any) {
        console.error(`   ❌ Error creando ${teamData.name}:`, error.message);
      }
    }
  }

  console.log('\n📅 Creando partidas...\n');

  // Crear partidas para torneos IN_PROGRESS
  const inProgressTournaments = tournaments.filter(t => t.status === 'IN_PROGRESS');

  for (const tournament of inProgressTournaments) {
    const teamIds = createdTeamsByTournament[tournament.id] || [];
    
    if (teamIds.length < 2) {
      console.log(`⚠️ ${tournament.name}: No hay suficientes equipos para crear partidas`);
      continue;
    }

    console.log(`🎯 Creando partidas para: ${tournament.name}`);

    // Verificar si ya hay partidas
    const existingMatches = await prisma.match.count({
      where: { tournament_id: tournament.id }
    });

    if (existingMatches > 0) {
      console.log(`   ⏭️ Ya existen ${existingMatches} partidas`);
      continue;
    }

    // Crear partidas según el formato
    if (tournament.format === 'ROUND_ROBIN') {
      // Round Robin: todos contra todos
      let matchNumber = 1;
      let round = 1;
      
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          const scheduledDate = new Date(tournament.start_date);
          scheduledDate.setDate(scheduledDate.getDate() + Math.floor(matchNumber / 4));

          const isCompleted = matchNumber <= 3; // Primeras 3 partidas completadas
          
          try {
            await prisma.match.create({
              data: {
                tournament_id: tournament.id,
                round: round,
                match_number: matchNumber,
                bracket_position: matchNumber,
                home_team_id: teamIds[i],
                away_team_id: teamIds[j],
                scheduled_datetime: scheduledDate,
                best_of: 1,
                status: isCompleted ? 'COMPLETED' : 'SCHEDULED',
                home_score: isCompleted ? Math.floor(Math.random() * 3) : 0,
                away_score: isCompleted ? Math.floor(Math.random() * 3) : 0,
                winner_id: isCompleted ? (Math.random() > 0.5 ? teamIds[i] : teamIds[j]) : null
              }
            });
            matchNumber++;
            matchesCreated++;
          } catch (error: any) {
            console.error(`   ❌ Error creando partida:`, error.message);
          }
        }
        round++;
      }
      console.log(`   ✅ Creadas ${matchNumber - 1} partidas (Round Robin)`);
    } else {
      // Eliminación simple/doble: brackets
      const rounds = Math.ceil(Math.log2(teamIds.length));
      let matchNumber = 1;
      
      for (let round = 1; round <= rounds; round++) {
        const matchesInRound = Math.pow(2, rounds - round);
        
        for (let m = 0; m < matchesInRound && matchNumber <= teamIds.length / 2; m++) {
          const homeTeamIndex = m * 2;
          const awayTeamIndex = m * 2 + 1;
          
          if (awayTeamIndex >= teamIds.length) break;

          const scheduledDate = new Date(tournament.start_date);
          scheduledDate.setDate(scheduledDate.getDate() + (round - 1) * 3);

          const isCompleted = round === 1 && m < 2; // Solo primeras 2 partidas de ronda 1

          try {
            await prisma.match.create({
              data: {
                tournament_id: tournament.id,
                round: round,
                match_number: matchNumber,
                bracket_position: matchNumber,
                home_team_id: teamIds[homeTeamIndex],
                away_team_id: teamIds[awayTeamIndex],
                scheduled_datetime: scheduledDate,
                best_of: round === rounds ? 5 : 3, // Final BO5, resto BO3
                status: isCompleted ? 'COMPLETED' : (round === 1 ? 'SCHEDULED' : 'SCHEDULED'),
                home_score: isCompleted ? (Math.random() > 0.5 ? 2 : 1) : 0,
                away_score: isCompleted ? (Math.random() > 0.5 ? 2 : 1) : 0,
                winner_id: isCompleted ? (Math.random() > 0.5 ? teamIds[homeTeamIndex] : teamIds[awayTeamIndex]) : null
              }
            });
            matchNumber++;
            matchesCreated++;
          } catch (error: any) {
            console.error(`   ❌ Error creando partida:`, error.message);
          }
        }
      }
      console.log(`   ✅ Creadas ${matchNumber - 1} partidas (Eliminación)`);
    }
  }

  // Crear partidas LIVE (en vivo) para algunos torneos
  console.log('\n🔴 Creando partidas EN VIVO...');
  
  const liveMatchTournaments = tournaments.slice(0, 2);
  for (const tournament of liveMatchTournaments) {
    const teamIds = createdTeamsByTournament[tournament.id] || [];
    if (teamIds.length < 2) continue;

    try {
      const existingLive = await prisma.match.findFirst({
        where: {
          tournament_id: tournament.id,
          status: 'LIVE'
        }
      });

      if (!existingLive) {
        await prisma.match.create({
          data: {
            tournament_id: tournament.id,
            round: 1,
            match_number: 999,
            bracket_position: 999,
            home_team_id: teamIds[0],
            away_team_id: teamIds[1],
            scheduled_datetime: new Date(),
            best_of: 3,
            status: 'LIVE',
            home_score: Math.floor(Math.random() * 2),
            away_score: Math.floor(Math.random() * 2)
          }
        });
        console.log(`   🔴 Partida LIVE creada para: ${tournament.name}`);
        matchesCreated++;
      }
    } catch (error: any) {
      console.error(`   ❌ Error creando partida live:`, error.message);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   🏟️ Equipos creados: ${teamsCreated}`);
  console.log(`   ⚔️ Partidas creadas: ${matchesCreated}`);
}

addTeamsAndMatches()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
