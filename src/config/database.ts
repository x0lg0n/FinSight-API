import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Singleton Prisma client instance
 * Ensures only one connection pool is created
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
let isClosed = false;

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export async function closeDatabase(): Promise<void> {
  if (isClosed) {
    return;
  }

  isClosed = true;
  await prisma.$disconnect();
  await pool.end();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, disconnecting Prisma...');
  await closeDatabase();
  process.exit(0);
});

export default prisma;
