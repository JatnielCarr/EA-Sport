import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addClashRoyale() {
  const game = await prisma.game.upsert({
    where: { slug: 'clash-royale' },
    update: {},
    create: {
      name: 'Clash Royale',
      slug: 'clash-royale',
      developer: 'Supercell',
      icon_url: 'https://example.com/clash-royale-icon.png',
      team_size_default: 1,
    },
  });
  
  console.log('✅ Clash Royale agregado:', game);
  await prisma.$disconnect();
}

addClashRoyale().catch(console.error);
