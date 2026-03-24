import { buildApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3100;

async function startServer() {
  try {
    // Connect to MySQL database (Prisma)
    await connectDatabase();

    const app = await buildApp();

    await app.listen({ port: PORT, host: '127.0.0.1' });

    console.log('');
    console.log('='.repeat(60));
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log('='.repeat(60));
    console.log('');

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\nReceived ${signal}, shutting down gracefully...`);
        await app.close();
        await disconnectDatabase();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };