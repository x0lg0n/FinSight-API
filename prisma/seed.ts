import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcryptjs from 'bcryptjs';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    await prisma.financialRecord.deleteMany({});
    await prisma.user.deleteMany({});

    // Create admin user
    const adminPassword = await bcryptjs.hash('Admin@1234', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@finance.dev',
        password: adminPassword,
        name: 'Admin User',
        role: Role.ADMIN,
        isActive: true,
      },
    });

    // Create analyst user
    const analystPassword = await bcryptjs.hash('Analyst@1234', 10);
    await prisma.user.create({
      data: {
        email: 'analyst@finance.dev',
        password: analystPassword,
        name: 'Analyst User',
        role: Role.ANALYST,
        isActive: true,
      },
    });

    // Create viewer user
    const viewerPassword = await bcryptjs.hash('Viewer@1234', 10);
    await prisma.user.create({
      data: {
        email: 'viewer@finance.dev',
        password: viewerPassword,
        name: 'Viewer User',
        role: Role.VIEWER,
        isActive: true,
      },
    });

    // Create sample financial records for admin
    const now = new Date();
    const recordsData = [
      {
        amount: 5000.0,
        type: 'INCOME' as const,
        category: 'Salary',
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        notes: 'Monthly salary',
        userId: admin.id,
      },
      {
        amount: 1200.0,
        type: 'EXPENSE' as const,
        category: 'Rent',
        date: new Date(now.getFullYear(), now.getMonth(), 5),
        notes: 'Monthly rent',
        userId: admin.id,
      },
      {
        amount: 250.0,
        type: 'EXPENSE' as const,
        category: 'Utilities',
        date: new Date(now.getFullYear(), now.getMonth(), 10),
        notes: 'Electricity and water',
        userId: admin.id,
      },
      {
        amount: 300.0,
        type: 'EXPENSE' as const,
        category: 'Groceries',
        date: new Date(now.getFullYear(), now.getMonth(), 15),
        notes: 'Weekly shopping',
        userId: admin.id,
      },
      {
        amount: 150.0,
        type: 'EXPENSE' as const,
        category: 'Travel',
        date: new Date(now.getFullYear(), now.getMonth(), 20),
        notes: 'Gas and parking',
        userId: admin.id,
      },
    ];

    await prisma.financialRecord.createMany({
      data: recordsData,
    });

    console.log('✅ Seed completed successfully!');
    console.log('📝 Created users:');
    console.log(`   - Admin: admin@finance.dev / Admin@1234`);
    console.log(`   - Analyst: analyst@finance.dev / Analyst@1234`);
    console.log(`   - Viewer: viewer@finance.dev / Viewer@1234`);
    console.log(`✅ Created ${recordsData.length} sample financial records`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed();
