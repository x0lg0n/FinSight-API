import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

const port = env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    console.log('🔌 Connecting to database...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // Start the server
    const server = app.listen(port, () => {
      console.log(`✅ Server is running on http://localhost:${port}`);
      console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
      console.log(`\n🚀 Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        console.log('Server closed');
        await prisma.$disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close(async () => {
        console.log('Server closed');
        await prisma.$disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
