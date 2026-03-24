import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { swaggerConfig } from './config/swagger';
import { initializeFirebase } from './config/firebase';
import { firebaseAuthRoutes } from './routes/firebase-auth.routes';
import { discordAuthRoutes } from './routes/discord-auth.routes';
import { telegramRoutes } from './routes/telegram.routes';
import { paymentRoutes } from './routes/payment.routes';
import { subscriptionRoutes } from './routes/subscription.routes';
import { userRoutes } from './routes/user.routes';
import { liveUpdatesRoutes } from './routes/live-updates';
import { monetizationRoutes } from './routes/monetization.routes';
import { aiRoutes } from './routes/ai.routes';
import { stripeWebhookRoutes } from './routes/stripe-webhook.routes';
import { notificationRoutes } from './routes/notification.routes';
import { emailAuthRoutes } from './routes/email-auth.routes';
import { checkInRoutes } from './routes/checkin.routes';
import { adminFinanceRoutes } from './routes/admin-finance.routes';
import { castRoutes } from './routes/cast.routes';
import { pushRoutes } from './routes/push.routes';
import { startCronJobs } from './services/cron.service';

// ===== SERVER-AUTHORITATIVE: Zero Trust Middleware =====
import { authenticate, globalSanitizer } from './middleware';

// ===== Controllers =====
import { authController } from './controllers/auth.controller';
import { userController } from './controllers/user.controller';
import { tournamentController } from './controllers/tournament.controller';
import { gameController } from './controllers/game.controller';
import { teamController } from './controllers/team.controller';
import { matchController } from './controllers/match.controller';
import { standingController } from './controllers/standing.controller';
import { clanController } from './controllers/clan.controller';
import { miscController } from './controllers/misc.controller';
import { reputationController } from './controllers/reputation.controller';
import { freeAgentController } from './controllers/free-agent.controller';

const JWT_SECRET = process.env.JWT_SECRET || 'ea-sports-tournament-secret-key-2024';

export async function buildApp() {
  // Inicializar Firebase al arrancar la app
  try {
    initializeFirebase();
  } catch (error) {
    console.warn('⚠️ Firebase no pudo inicializarse. Las funciones en tiempo real no estarán disponibles.');
  }

  const app = Fastify({
    logger: true,
    disableRequestLogging: process.env.NODE_ENV === 'test'
  });

  // Enable rawBody for Stripe webhook signature verification
  await app.register(require('fastify-raw-body'), {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
    routes: ['/stripe/webhook'],
  });

  // CORS Configuration
  const CORS_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:5179',
      'http://localhost:5180',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5176',
      'http://127.0.0.1:5177',
      'http://127.0.0.1:5178',
      'http://localhost:4173',
      'http://127.0.0.1:4173'
    ];

  // ===== Register Plugins =====
  await app.register(helmet, {
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false
  });
  await app.register(cors, {
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });

  // Rate Limiting — Global: 100 requests per minute per IP
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request: any, context: any) => ({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Demasiadas solicitudes. Límite: ${context.max} por ${context.after}. Intenta de nuevo después.`,
        retryAfter: context.after
      }
    })
  });

  // JWT
  await app.register(fastifyJwt, {
    secret: JWT_SECRET
  });

  // ===== SERVER-AUTHORITATIVE: Global Sanitizer Hook =====
  app.addHook('onRequest', globalSanitizer);

  // Legacy authenticate decorator (backward compatibility with route files)
  app.decorate('authenticate', authenticate);

  // ===== Swagger Documentation =====
  await app.register(require('@fastify/swagger'), swaggerConfig);
  await app.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header
  });

  // ===== Register External Route Files =====
  await app.register(firebaseAuthRoutes);
  await app.register(discordAuthRoutes);
  await app.register(telegramRoutes);
  await app.register(paymentRoutes);
  await app.register(subscriptionRoutes);
  await app.register(userRoutes);
  await app.register(liveUpdatesRoutes);
  await app.register(monetizationRoutes);
  await app.register(aiRoutes);
  await app.register(stripeWebhookRoutes);

  // ===== Register Controllers (inline routes refactored from app.ts) =====
  await app.register(authController);
  await app.register(userController);
  await app.register(tournamentController);
  await app.register(gameController);
  await app.register(teamController);
  await app.register(matchController);
  await app.register(standingController);
  await app.register(clanController);
  await app.register(miscController);
  await app.register(reputationController);
  await app.register(freeAgentController);
  await app.register(notificationRoutes);
  await app.register(emailAuthRoutes);
  await app.register(checkInRoutes);
  await app.register(adminFinanceRoutes);
  await app.register(castRoutes);
  await app.register(pushRoutes);

  // Start cron jobs
  startCronJobs();

  // 404 handler
  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found'
      }
    });
  });

  return app;
}