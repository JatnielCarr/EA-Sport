import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Tournament API', () => {
  let app: FastifyInstance;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Create a test user and get auth token
    const userData = {
      email: 'tournament-test@example.com',
      username: 'tournamenttest',
      password: 'TestPassword123!'
    };

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: userData
    });

    const registerBody = JSON.parse(registerResponse.payload);
    authToken = registerBody.data.tokens.accessToken;
    testUserId = registerBody.data.user.id;

    // Create a test game
    await prisma.game.create({
      data: {
        name: 'League of Legends',
        slug: 'lol',
        developer: 'Riot Games',
        team_size_default: 5
      }
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('POST /api/tournaments', () => {
    it('should create a tournament successfully', async () => {
      const tournamentData = {
        name: 'Test Tournament',
        slug: 'test-tournament',
        gameId: 'lol',
        format: 'SINGLE_ELIMINATION',
        teamSize: 5,
        maxParticipants: 16,
        region: 'NA',
        entryFee: 10,
        prizePool: 160,
        startDate: '2025-12-01T00:00:00Z',
        endDate: '2025-12-02T00:00:00Z',
        registrationDeadline: '2025-11-30T00:00:00Z'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/tournaments',
        payload: tournamentData,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.tournament).toHaveProperty('id');
      expect(body.data.tournament.name).toBe(tournamentData.name);
      expect(body.data.tournament.organizerId).toBe(testUserId);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        slug: 'test-tournament-2',
        gameId: 'lol',
        format: 'INVALID_FORMAT', // Invalid format
        teamSize: 5,
        maxParticipants: 16,
        region: 'NA',
        startDate: '2025-12-01T00:00:00Z',
        registrationDeadline: '2025-11-30T00:00:00Z'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/tournaments',
        payload: invalidData,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/tournaments', () => {
    it('should list tournaments with pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tournaments?page=1&limit=10'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.pagination).toHaveProperty('page');
      expect(body.pagination).toHaveProperty('limit');
      expect(body.pagination).toHaveProperty('total');
      expect(body.pagination).toHaveProperty('totalPages');
    });

    it('should filter tournaments by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tournaments?status=DRAFT'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      // All returned tournaments should have DRAFT status
      body.data.forEach((tournament: any) => {
        expect(tournament.status).toBe('DRAFT');
      });
    });
  });
});