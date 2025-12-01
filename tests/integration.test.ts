import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Tournament Integration Tests', () => {
  let app: FastifyInstance;
  let organizerToken: string;
  let organizerId: string;
  let player1Token: string;
  let player1Id: string;
  let player2Token: string;
  let player2Id: string;
  let tournamentId: string;
  let team1Id: string;
  let team2Id: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Create organizer
    const organizerData = {
      email: 'organizer@example.com',
      username: 'organizer',
      password: 'TestPassword123!'
    };

    const organizerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: organizerData
    });

    const organizerBody = JSON.parse(organizerResponse.payload);
    organizerToken = organizerBody.data.tokens.accessToken;
    organizerId = organizerBody.data.user.id;

    // Create player 1
    const player1Data = {
      email: 'player1@example.com',
      username: 'player1',
      password: 'TestPassword123!'
    };

    const player1Response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: player1Data
    });

    const player1Body = JSON.parse(player1Response.payload);
    player1Token = player1Body.data.tokens.accessToken;
    player1Id = player1Body.data.user.id;

    // Create player 2
    const player2Data = {
      email: 'player2@example.com',
      username: 'player2',
      password: 'TestPassword123!'
    };

    const player2Response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: player2Data
    });

    const player2Body = JSON.parse(player2Response.payload);
    player2Token = player2Body.data.tokens.accessToken;
    player2Id = player2Body.data.user.id;

    // Create test game
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

  it('should complete full tournament workflow', async () => {
    // 1. Create tournament
    const tournamentData = {
      name: 'Integration Test Tournament',
      slug: 'integration-test-tournament',
      gameId: 'lol',
      format: 'SINGLE_ELIMINATION',
      teamSize: 5,
      maxParticipants: 4,
      region: 'NA',
      entryFee: 10,
      prizePool: 40,
      startDate: '2025-12-01T00:00:00Z',
      endDate: '2025-12-02T00:00:00Z',
      registrationDeadline: '2025-11-30T00:00:00Z'
    };

    const createTournamentResponse = await app.inject({
      method: 'POST',
      url: '/api/tournaments',
      payload: tournamentData,
      headers: {
        Authorization: `Bearer ${organizerToken}`
      }
    });

    expect(createTournamentResponse.statusCode).toBe(201);
    const tournamentBody = JSON.parse(createTournamentResponse.payload);
    tournamentId = tournamentBody.data.tournament.id;

    // 2. Publish tournament
    const publishResponse = await app.inject({
      method: 'POST',
      url: `/api/tournaments/${tournamentId}/publish`,
      headers: {
        Authorization: `Bearer ${organizerToken}`
      }
    });

    expect(publishResponse.statusCode).toBe(200);

    // 3. Create team 1
    const team1Data = {
      tournamentId,
      name: 'Team Alpha',
      tag: 'ALP'
    };

    const createTeam1Response = await app.inject({
      method: 'POST',
      url: '/api/teams',
      payload: team1Data,
      headers: {
        Authorization: `Bearer ${player1Token}`
      }
    });

    expect(createTeam1Response.statusCode).toBe(201);
    const team1Body = JSON.parse(createTeam1Response.payload);
    team1Id = team1Body.data.team.id;

    // 4. Create team 2
    const team2Data = {
      tournamentId,
      name: 'Team Beta',
      tag: 'BET'
    };

    const createTeam2Response = await app.inject({
      method: 'POST',
      url: '/api/teams',
      payload: team2Data,
      headers: {
        Authorization: `Bearer ${player2Token}`
      }
    });

    expect(createTeam2Response.statusCode).toBe(201);
    const team2Body = JSON.parse(createTeam2Response.payload);
    team2Id = team2Body.data.team.id;

    // 5. Approve teams (as organizer)
    await prisma.team.update({
      where: { id: team1Id },
      data: { approved: true }
    });

    await prisma.team.update({
      where: { id: team2Id },
      data: { approved: true }
    });

    // 6. Generate bracket
    const generateBracketResponse = await app.inject({
      method: 'POST',
      url: `/api/tournaments/${tournamentId}/generate-bracket`,
      headers: {
        Authorization: `Bearer ${organizerToken}`
      }
    });

    expect(generateBracketResponse.statusCode).toBe(200);
    const bracketBody = JSON.parse(generateBracketResponse.payload);
    expect(bracketBody.success).toBe(true);

    // 7. Verify bracket was generated
    const getBracketResponse = await app.inject({
      method: 'GET',
      url: `/api/tournaments/${tournamentId}/bracket`
    });

    expect(getBracketResponse.statusCode).toBe(200);
    const getBracketBody = JSON.parse(getBracketResponse.payload);
    expect(getBracketBody.success).toBe(true);
    expect(getBracketBody.data.bracket.matches).toBeInstanceOf(Array);
    expect(getBracketBody.data.bracket.matches.length).toBeGreaterThan(0);

    // 8. Check standings
    const standingsResponse = await app.inject({
      method: 'GET',
      url: `/api/tournaments/${tournamentId}/standings`
    });

    expect(standingsResponse.statusCode).toBe(200);
    const standingsBody = JSON.parse(standingsResponse.payload);
    expect(standingsBody.success).toBe(true);
    expect(standingsBody.data.standings).toBeInstanceOf(Array);
  });
});