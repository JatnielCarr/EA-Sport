import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Setup global test environment
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/esports_test_db?schema=public';

  // Create test database if it doesn't exist
  try {
    execSync('createdb esports_test_db', { stdio: 'ignore' });
  } catch (error) {
    // Database might already exist, ignore
  }

  // Run migrations
  execSync('npx prisma migrate deploy', { stdio: 'ignore' });

  // Generate Prisma client
  execSync('npx prisma generate', { stdio: 'ignore' });
});

afterAll(async () => {
  // Clean up test database
  const prisma = new PrismaClient();
  await prisma.$disconnect();

  try {
    execSync('dropdb esports_test_db', { stdio: 'ignore' });
  } catch (error) {
    // Ignore if database doesn't exist
  }
});