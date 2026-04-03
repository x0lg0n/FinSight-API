import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import bcryptjs from 'bcryptjs';
import { Role } from '@prisma/client';

describe('Dashboard', () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let adminId: string;

  beforeAll(async () => {
    await prisma.financialRecord.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const adminPassword = await bcryptjs.hash('AdminPass123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: adminPassword,
        name: 'Admin',
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;

    const analystPassword = await bcryptjs.hash('AnalystPass123', 10);
    await prisma.user.create({
      data: {
        email: 'analyst@test.com',
        password: analystPassword,
        name: 'Analyst',
        role: Role.ANALYST,
      },
    });

    const viewerPassword = await bcryptjs.hash('ViewerPass123', 10);
    await prisma.user.create({
      data: {
        email: 'viewer@test.com',
        password: viewerPassword,
        name: 'Viewer',
        role: Role.VIEWER,
      },
    });

    // Get tokens
    let res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass123',
      });
    adminToken = res.body.data.token;

    res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'analyst@test.com',
        password: 'AnalystPass123',
      });
    analystToken = res.body.data.token;

    res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'viewer@test.com',
        password: 'ViewerPass123',
      });
    viewerToken = res.body.data.token;

    // Create test records
    await prisma.financialRecord.create({
      data: {
        amount: 5000,
        type: 'INCOME',
        category: 'Salary',
        date: new Date(),
        userId: adminId,
      },
    });

    await prisma.financialRecord.create({
      data: {
        amount: 1200,
        type: 'EXPENSE',
        category: 'Rent',
        date: new Date(),
        userId: adminId,
      },
    });

    await prisma.financialRecord.create({
      data: {
        amount: 300,
        type: 'EXPENSE',
        category: 'Food',
        date: new Date(),
        userId: adminId,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/dashboard/summary', () => {
    it('should get summary for all roles', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalIncome');
      expect(response.body.data).toHaveProperty('totalExpense');
      expect(response.body.data).toHaveProperty('netBalance');
    });

    it('should calculate correct totals', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.data.totalIncome).toBe(5000);
      expect(response.body.data.totalExpense).toBe(1500);
      expect(response.body.data.netBalance).toBe(3500);
    });
  });

  describe('GET /api/dashboard/categories', () => {
    it('should get category breakdown as analyst', async () => {
      const response = await request(app)
        .get('/api/dashboard/categories')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('income');
      expect(response.body.data).toHaveProperty('expense');
    });

    it('should fail as viewer', async () => {
      const response = await request(app)
        .get('/api/dashboard/categories')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should get monthly trends as admin', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail as viewer', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/dashboard/recent', () => {
    it('should get recent activity for all roles', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/dashboard/top-categories', () => {
    it('should get top spending categories as analyst', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-categories')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });
});
