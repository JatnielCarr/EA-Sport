
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tournament = await prisma.tournament.findFirst({
        orderBy: { created_at: 'desc' },
    });

    if (tournament) {
        console.log('Latest Tournament:', tournament);
        console.log('Format:', tournament.format);
    } else {
        console.log('No tournaments found.');
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
