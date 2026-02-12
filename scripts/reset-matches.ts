
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tournament = await prisma.tournament.findFirst({
        orderBy: { created_at: 'desc' },
        include: { matches: true }
    });

    if (!tournament) {
        console.log('❌ No tournament found.');
        return;
    }

    console.log(`🗑️ Resetting matches for: ${tournament.name}`);
    console.log(`Found ${tournament.matches.length} matches to delete.`);

    // Delete all matches
    await prisma.match.deleteMany({
        where: { tournament_id: tournament.id }
    });

    // Reset bracket_generated flag
    await prisma.tournament.update({
        where: { id: tournament.id },
        data: { bracket_generated: false }
    });

    console.log('✅ Matches deleted! Go to the UI and click "Generar Bracket" again.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
