
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tournament = await prisma.tournament.findFirst({
        orderBy: { created_at: 'desc' },
    });

    if (!tournament) {
        console.log('❌ No tournament found.');
        return;
    }

    console.log(`🏆 Updating Tournament: ${tournament.name}`);
    console.log(`👉 Current Format: ${tournament.format}`);

    if (tournament.format === 'SINGLE_ELIMINATION') {
        console.log('✅ Already SINGLE_ELIMINATION. No changes needed.');
    } else {
        await prisma.tournament.update({
            where: { id: tournament.id },
            data: { format: 'SINGLE_ELIMINATION' }
        });
        console.log('✅ Updated to SINGLE_ELIMINATION! Matches will now show as a connected bracket.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
