import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './libs/logger';
import { prisma } from './prisma/client';

const host = env.HOST;
const port = Number(env.PORT);

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(port, host, () => {
      logger.info(`Server running on http://${host}:${port}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);

      await prisma.$disconnect();
      logger.info('Database disconnected');

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
