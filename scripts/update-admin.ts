import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updatePasswords() {
  const hash = await bcrypt.hash('admin123', 10);
  
  // Get all users and update their passwords
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hash }
    });
    console.log(`Updated password for: ${user.email}`);
  }
  
  // Create admin if not exists
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    await prisma.user.create({
      data: {
        email: 'admin@easports.com',
        username: 'AdminEA',
        password_hash: hash,
        role: 'ADMIN',
        verified: true
      }
    });
    console.log('Created new admin: admin@easports.com');
  } else {
    console.log(`Existing admin: ${admin.email}`);
  }
  
  console.log('\n✅ All passwords updated to: admin123');
  console.log('📧 Login with any existing user email and password: admin123');
  
  await prisma.$disconnect();
}

updatePasswords().catch(console.error);
