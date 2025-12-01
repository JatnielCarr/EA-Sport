import { PrismaClient } from '@prisma/client';

// Create Prisma Client with logging
export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
});

// Function to connect to database
export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Function to disconnect from database
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('Database disconnected');
}

export default prisma;
