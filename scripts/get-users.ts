import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      username: true,
      role: true,
      password_hash: true
    }
  });
  
  console.log('\n📧 Usuarios disponibles para login:\n');
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`Username: ${u.username}`);
    console.log(`Role: ${u.role}`);
    console.log(`Password hash: ${u.password_hash.substring(0, 20)}...`);
    console.log('---');
  });
  
  await prisma.$disconnect();
}

getUsers().catch(console.error);
