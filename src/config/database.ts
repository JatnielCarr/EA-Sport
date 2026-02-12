import { PrismaClient } from '@prisma/client';

// Create Prisma Client with logging
export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
});

// Function to connect to database
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log('✅ Database connected successfully');
}

// Function to disconnect from database
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('Database disconnected');
}

export default prisma;
