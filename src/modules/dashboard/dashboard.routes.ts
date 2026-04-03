import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { Role } from '@prisma/client';

const router: Router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary (All roles)
 *     description: Get total income, expenses, and net balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                       example: 5000.00
 *                     totalExpense:
 *                       type: number
 *                       example: 1900.00
 *                     netBalance:
 *                       type: number
 *                       example: 3100.00
 *                     currency:
 *                       type: string
 *                       example: USD
 *       401:
 *         description: Unauthorized
 */
router.get('/summary', DashboardController.getSummary);

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category breakdown (Analyst & Admin)
 *     description: Get income and expense breakdown by category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     income:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           amount:
 *                             type: number
 *                     expense:
 *                       type: array
 *       403:
 *         description: Forbidden - Analyst or Admin access required
 */
router.get(
  '/categories',
  requireRole(Role.ANALYST, Role.ADMIN),
  DashboardController.getCategoryBreakdown,
);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly trends (Analyst & Admin)
 *     description: Get income vs expense trends for past 12 months
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "2024-01"
 *                       income:
 *                         type: number
 *                       expense:
 *                         type: number
 */
router.get(
  '/trends',
  requireRole(Role.ANALYST, Role.ADMIN),
  DashboardController.getMonthlyTrends,
);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent transactions (All roles)
 *     description: Get last 10 financial transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FinancialRecord'
 */
router.get('/recent', DashboardController.getRecentActivity);

/**
 * @swagger
 * /api/dashboard/top-categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get top spending categories (Analyst & Admin)
 *     description: Get top 5 expense categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       totalSpent:
 *                         type: number
 */
router.get(
  '/top-categories',
  requireRole(Role.ANALYST, Role.ADMIN),
  DashboardController.getTopCategories,
);

export default router;
