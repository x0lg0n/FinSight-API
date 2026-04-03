import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import bcryptjs from 'bcryptjs';
import { Role } from '@prisma/client';

describe('Financial Records', () => {
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/records', () => {
    it('should create record as admin', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1500.50,
          type: 'INCOME',
          category: 'Salary',
          date: new Date().toISOString(),
          notes: 'Monthly salary',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(1500.50);
      expect(response.body.data.category).toBe('Salary');
    });

    it('should fail to create record as non-admin', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          amount: 1000,
          type: 'INCOME',
          category: 'Bonus',
          date: new Date().toISOString(),
        });

      expect(response.status).toBe(403);
    });

    it('should fail with invalid amount', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: -100,
          type: 'INCOME',
          category: 'Test',
          date: new Date().toISOString(),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/records', () => {
    beforeAll(async () => {
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
          amount: 200,
          type: 'EXPENSE',
          category: 'Groceries',
          date: new Date(),
          userId: adminId,
        },
      });
    });

    it('should list all records as analyst', async () => {
      const response = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should fail to list all records as viewer', async () => {
      const response = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/records?type=INCOME')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((r: any) => r.type === 'INCOME')).toBe(true);
    });
  });

  describe('GET /api/records/my', () => {
    it('should list own records as viewer', async () => {
      const response = await request(app)
        .get('/api/records/my/list')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/records/:id', () => {
    let recordId: string;

    beforeAll(async () => {
      const record = await prisma.financialRecord.create({
        data: {
          amount: 500,
          type: 'EXPENSE',
          category: 'Entertainment',
          date: new Date(),
          userId: adminId,
        },
      });
      recordId = record.id;
    });

    it('should soft delete record as admin', async () => {
      const response = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify soft delete
      const record = await prisma.financialRecord.findUnique({
        where: { id: recordId },
      });
      expect(record?.deletedAt).not.toBeNull();
    });

    it('should fail to delete as non-admin', async () => {
      const record = await prisma.financialRecord.create({
        data: {
          amount: 300,
          type: 'EXPENSE',
          category: 'Transportation',
          date: new Date(),
          userId: adminId,
        },
      });

      const response = await request(app)
        .delete(`/api/records/${record.id}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(403);
    });
  });
});
