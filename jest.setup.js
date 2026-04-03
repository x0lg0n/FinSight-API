// Load .env.test file before any tests run
require('dotenv').config({ path: '.env.test' });

// Set test NODE_ENV
process.env.NODE_ENV = 'test';

// Ensure DATABASE_URL is set for tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/finance_db';
}

console.log('✅ Jest setup complete - environment variables loaded');
