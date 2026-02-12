
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tournament = await prisma.tournament.findFirst({
        orderBy: { created_at: 'desc' },
        include: { matches: true }
    });

    if (!tournament) {
        console.log('No tournament found.');
        return;
    }

    console.log(`Tournament: ${tournament.name} (${tournament.format})`);
    console.log(`Total Matches: ${tournament.matches.length}`);

    // Group by round
    const rounds = {};
    tournament.matches.forEach(m => {
        rounds[m.round] = (rounds[m.round] || 0) + 1;
    });

    console.log('Matches per round:', rounds);

    // Check if it looks like a valid Single Elimination for 16 teams
    // Should be: R1:8, R2:4, R3:2, R4:1
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
