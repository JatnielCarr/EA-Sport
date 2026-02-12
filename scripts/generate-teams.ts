
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Names for dummy teams
const TEAM_NAMES = [
    'Team Alpha', 'Team Bravo', 'Team Charlie', 'Delta Force',
    'Echo Squad', 'Foxtrot Unit', 'Golf Gamers', 'Hotel Heroes',
    'India Ink', 'Juliet Jets', 'Kilo Kings', 'Lima Legends',
    'Mike Masters', 'November Knights', 'Oscar Ops', 'Papa Pros'
];

async function main() {
    console.log('🌱 Seeding Tournament Teams...');

    // 1. Find the most recent suitable tournament (Open or Draft)
    const tournament = await prisma.tournament.findFirst({
        where: {
            status: { in: ['DRAFT', 'REGISTRATION_OPEN', 'PUBLISHED'] }
        },
        orderBy: { created_at: 'desc' },
        include: { teams: true }
    });

    if (!tournament) {
        console.error('❌ No suitable tournament found (DRAFT/OPEN). Create one first!');
        return;
    }

    console.log(`🏆 Selected Tournament: ${tournament.name} (${tournament.id})`);
    console.log(`📊 Current Teams: ${tournament.teams.length}`);

    const targetTeamCount = 16;
    const teamsNeeded = targetTeamCount - tournament.teams.length;

    if (teamsNeeded <= 0) {
        console.log('✅ Tournament already has enough teams.');
        return;
    }

    console.log(`🚀 Generating ${teamsNeeded} new teams...`);

    for (let i = 0; i < teamsNeeded; i++) {
        const suffix = randomBytes(2).toString('hex');
        const teamName = TEAM_NAMES[i] || `Team ${suffix.toUpperCase()}`;
        const username = `BotPlayer_${suffix}`;
        const email = `bot_${suffix}@example.com`;

        // 2. Create Dummy Captain
        const user = await prisma.user.create({
            data: {
                username: username,
                email: email,
                password_hash: 'dummy_hash', // Not for login
                role: 'USER',
                verified: true
            }
        });

        // 3. Create Team linked to Tournament & Captain
        await prisma.team.create({
            data: {
                name: `${teamName} ${suffix}`, // Unique name
                tag: suffix.substring(0, 5).toUpperCase(),
                tournament_id: tournament.id,
                captain_id: user.id,
                approved: true, // Auto-approve
            }
        });

        console.log(`   + Created: ${teamName} (Cap: ${username})`);
    }

    console.log('✅ Seeding Complete! Go to the backend/frontend to Generate Bracket.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
