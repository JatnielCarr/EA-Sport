import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addClashRoyale() {
  const game = await prisma.game.upsert({
    where: { slug: 'clash-royale' },
    update: {
      icon_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Clash_Royale.png/220px-Clash_Royale.png',
    },
    create: {
      name: 'Clash Royale',
      slug: 'clash-royale',
      developer: 'Supercell',
      icon_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Clash_Royale.png/220px-Clash_Royale.png',
      team_size_default: 1,
    },
  });
  
  console.log('✅ Clash Royale agregado:', game);
  await prisma.$disconnect();
}

addClashRoyale().catch(console.error);
