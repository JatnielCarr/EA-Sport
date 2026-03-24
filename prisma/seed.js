const { PrismaClient, TournamentFormat, TournamentStatus, MatchStatus, UserRole, ClanAccessType, ClanMemberRole } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Limpiar base de datos (Opcional, pero recomendado para empezar desde cero)
    console.log('🧹 Limpiando base de datos...');
    await prisma.matchResult.deleteMany();
    await prisma.match.deleteMany();
    await prisma.standing.deleteMany();
    await prisma.teamPlayer.deleteMany();
    await prisma.team.deleteMany();
    await prisma.clanMessage.deleteMany();
    await prisma.clanMember.deleteMany();
    await prisma.clanRequest.deleteMany();
    await prisma.clan.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.gameAccount.deleteMany();
    await prisma.game.deleteMany();
    // No borramos usuarios por si tienen cuentas importantes de admin,
    // pero podemos borrar los generados por el seed anterior.
    await prisma.user.deleteMany({
        where: { email: { endsWith: '@example.com' } }
    });

    // 2. Crear Juegos
    console.log('🎮 Creando juegos...');
    const games = await Promise.all([
        prisma.game.create({
            data: {
                name: 'Apex Legends',
                slug: 'apex-legends',
                developer: 'Respawn Entertainment',
                icon_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&h=200&fit=crop',
                team_size_default: 3,
            }
        }),
        prisma.game.create({
            data: {
                name: 'Valorant',
                slug: 'valorant',
                developer: 'Riot Games',
                icon_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&h=200&fit=crop',
                team_size_default: 5,
            }
        }),
        prisma.game.create({
            data: {
                name: 'Call of Duty: Warzone',
                slug: 'warzone',
                developer: 'Infinity Ward',
                icon_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&h=200&fit=crop',
                team_size_default: 4,
            }
        }),
        prisma.game.create({
            data: {
                name: 'League of Legends',
                slug: 'lol',
                developer: 'Riot Games',
                icon_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&h=200&fit=crop',
                team_size_default: 5,
            }
        })
    ]);

    const [apex, valorant, warzone, lol] = games;

    // 3. Crear Usuarios
    console.log('👥 Creando usuarios...');
    const usersToCreate = [
        { email: 'admin@example.com', username: 'AdminMaster', role: UserRole.ADMIN },
        { email: 'org1@example.com', username: 'ApexOrga', role: UserRole.ORGANIZER || UserRole.USER },
        { email: 'org2@example.com', username: 'ValoTournaments', role: UserRole.ORGANIZER || UserRole.USER },
    ];

    for (let i = 1; i <= 20; i++) {
        usersToCreate.push({
            email: `player${i}@example.com`,
            username: `ProGamer_${i}`,
            role: UserRole.USER,
            avatar_url: `https://i.pravatar.cc/150?u=${i}`
        });
    }

    const generatedUsers = [];
    for (const u of usersToCreate) {
        const user = await prisma.user.create({
            data: {
                ...u,
                password_hash: 'hashedpassword123', // Demo password
                verified: true,
            }
        });
        generatedUsers.push(user);
    }

    const admin = generatedUsers[0];
    const org1 = generatedUsers[1];
    const org2 = generatedUsers[2];
    const players = generatedUsers.slice(3);

    // 4. Crear Torneos
    console.log('🏆 Creando torneos...');

    const now = new Date();

    const upcomingDate = new Date(); upcomingDate.setDate(now.getDate() + 7);
    const registrationDeadline = new Date(); registrationDeadline.setDate(now.getDate() + 5);

    const pastDate = new Date(); pastDate.setDate(now.getDate() - 7);
    const pastDeadline = new Date(); pastDeadline.setDate(now.getDate() - 10);

    const tournaments = await Promise.all([
        // Upcoming Tournament
        prisma.tournament.create({
            data: {
                name: 'Apex Legends Summer Championship',
                slug: 'apex-summer-champ-2024',
                description: 'El torneo más grande del verano para Apex Legends. ¡Demuestra que eres el mejor depredador!',
                game_id: apex.id,
                organizer_id: org1.id,
                format: TournamentFormat.SINGLE_ELIMINATION,
                team_size: 3,
                max_participants: 16,
                region: 'América Latina',
                entry_fee: 15.00,
                prize_pool: 1500.00,
                start_date: upcomingDate,
                registration_deadline: registrationDeadline,
                status: TournamentStatus.REGISTRATION_OPEN,
                invite_code: 'APEX-SUMMER',
                requires_entry_fee: true,
            }
        }),
        // Live Tournament
        prisma.tournament.create({
            data: {
                name: 'Valorant Open Challenge',
                slug: 'valorant-open-challenge',
                description: 'Torneo abierto de fin de semana para equipos amateur y semiprofesionales.',
                game_id: valorant.id,
                organizer_id: org2.id,
                format: TournamentFormat.DOUBLE_ELIMINATION,
                team_size: 5,
                max_participants: 8,
                region: 'Global',
                entry_fee: 0,
                prize_pool: 250.00,
                start_date: now,
                registration_deadline: pastDeadline,
                status: TournamentStatus.IN_PROGRESS,
                invite_code: 'VAL-OPEN',
                twitch_url: 'https://twitch.tv/valorant',
                stream_active: true,
                bracket_generated: true,
            }
        }),
        // Completed Tournament
        prisma.tournament.create({
            data: {
                name: 'Warzone Weekend Brawl',
                slug: 'warzone-weekend-brawl',
                description: 'Batalla rápida de Warzone sin restricciones de armas.',
                game_id: warzone.id,
                organizer_id: org1.id,
                format: TournamentFormat.SINGLE_ELIMINATION,
                team_size: 4,
                max_participants: 8,
                region: 'Norteamérica',
                entry_fee: 5.00,
                prize_pool: 500.00,
                start_date: pastDate,
                end_date: pastDate,
                registration_deadline: pastDeadline,
                status: TournamentStatus.COMPLETED,
                invite_code: 'WZ-BRAWL',
                bracket_generated: true,
            }
        })
    ]);

    const [apexTourney, valoTourney, wzTourney] = tournaments;

    // 5. Crear Equipos para el Torneo Valorant (In Progress)
    console.log('🛡️ Creando equipos y brackets para Valorant...');
    const valoTeams = [];
    for (let i = 0; i < 8; i++) {
        const captain = players[i];
        const team = await prisma.team.create({
            data: {
                tournament_id: valoTourney.id,
                name: `Valo Team ${i + 1}`,
                tag: `VT${i + 1}`,
                captain_id: captain.id,
                approved: true,
                seed: i + 1,
                players: {
                    create: [
                        { user_id: captain.id, is_captain: true },
                        { user_id: players[i + 8].id } // Añadir otro jugador
                    ]
                }
            }
        });
        valoTeams.push(team);
    }

    // Bracket Quarterfinals (Valo)
    const vMatches = [];
    for (let i = 0; i < 4; i++) {
        const m = await prisma.match.create({
            data: {
                tournament_id: valoTourney.id,
                round: 1,
                match_number: i + 1,
                bracket_position: i + 1,
                home_team_id: valoTeams[i * 2].id,
                away_team_id: valoTeams[i * 2 + 1].id,
                status: MatchStatus.COMPLETED,
                winner_id: valoTeams[i * 2].id, // The home team always wins the seed for simplicity
                home_score: 2,
                away_score: 0,
                best_of: 3
            }
        });
        vMatches.push(m);
    }

    // Bracket Semifinals (Valo - Live)
    for (let i = 0; i < 2; i++) {
        await prisma.match.create({
            data: {
                tournament_id: valoTourney.id,
                round: 2,
                match_number: i + 1,
                bracket_position: i + 1,
                home_team_id: vMatches[i * 2].winner_id,
                away_team_id: vMatches[i * 2 + 1].winner_id,
                status: i === 0 ? MatchStatus.LIVE : MatchStatus.SCHEDULED,
                home_score: i === 0 ? 1 : 0,
                away_score: i === 0 ? 1 : 0,
                best_of: 3
            }
        });
    }

    // 6. Crear Clanes
    console.log('⚔️ Creando clanes...');
    const clan1 = await prisma.clan.create({
        data: {
            name: 'Predators Esports',
            tag: 'PRED',
            description: 'El clan más competitivo de la región. Solo jugamos para ganar.',
            leader_id: players[0].id,
            access_type: ClanAccessType.INVITE_ONLY,
            members: {
                create: [
                    { user_id: players[0].id, role: ClanMemberRole.LEADER },
                    { user_id: players[1].id, role: ClanMemberRole.OFFICER },
                    { user_id: players[2].id, role: ClanMemberRole.MEMBER },
                    { user_id: players[3].id, role: ClanMemberRole.MEMBER },
                ]
            }
        }
    });

    const clan2 = await prisma.clan.create({
        data: {
            name: 'Pew Pew Gang',
            tag: 'PEW',
            description: 'Clan casual para jugadores que quieren divertirse después del trabajo.',
            leader_id: players[4].id,
            access_type: ClanAccessType.OPEN,
            members: {
                create: [
                    { user_id: players[4].id, role: ClanMemberRole.LEADER },
                    { user_id: players[5].id, role: ClanMemberRole.MEMBER },
                ]
            }
        }
    });

    console.log('✅ Base de datos poblada exitosamente con datos de prueba!');
}

main()
    .catch((e) => {
        console.error('Error seeding data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
