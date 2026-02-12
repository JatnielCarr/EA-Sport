import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👑 Checking for Clash Royale...');

  const game = await prisma.game.upsert({
    where: { slug: 'clash-royale' },
    update: {},
    create: {
      name: 'Clash Royale',
      slug: 'clash-royale',
      developer: 'Supercell',
      icon_url: 'https://cdn.supercell.com/supercell.com/230914154924/supercell_img/clash_royale_icon_512.png',
      team_size_default: 1, // 1v1
    },
  });

  console.log(`✅ Clash Royale (ID: ${game.id}) is ready!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
