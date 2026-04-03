import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

/**
 * Dashboard service
 * Handles aggregation queries for dashboard analytics
 * All queries use PostgreSQL GROUP BY, SUM, DATE_TRUNC for efficiency
 */
export class DashboardService {
  /**
   * Get dashboard summary: total income, expenses, and net balance
   */
  static async getSummary(userId?: string) {
    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null,
    };

    if (userId) {
      where.userId = userId;
    }

    // Use raw query for efficient aggregation
    const result = await prisma.financialRecord.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true,
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    result.forEach((row) => {
      const amount = row._sum.amount ? Number(row._sum.amount) : 0;
      if (row.type === 'INCOME') {
        totalIncome = amount;
      } else {
        totalExpense = amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      currency: 'USD',
    };
  }

  /**
   * Get category-wise breakdown of income and expenses
   */
  static async getCategoryBreakdown(userId?: string) {
    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null,
    };

    if (userId) {
      where.userId = userId;
    }

    const result = await prisma.financialRecord.groupBy({
      by: ['type', 'category'],
      where,
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });

    const income = result
      .filter((r) => r.type === 'INCOME')
      .map((r) => ({
        category: r.category,
        amount: Number(r._sum.amount),
      }));

    const expense = result
      .filter((r) => r.type === 'EXPENSE')
      .map((r) => ({
        category: r.category,
        amount: Number(r._sum.amount),
      }));

    return { income, expense };
  }

  /**
   * Get monthly trends for past 12 months
   * Returns income and expense for each month
   */
  static async getMonthlyTrends(userId?: string) {
    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null,
    };

    if (userId) {
      where.userId = userId;
    }

    // Get data for past 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    where.date = {
      gte: twelveMonthsAgo,
    };

    const records = await prisma.financialRecord.findMany({
      where,
      select: {
        type: true,
        amount: true,
        date: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by month
    const monthlyData: Record<string, { income: number; expense: number }> = {};

    records.forEach((record) => {
      const month = new Date(record.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }

      const amount = Number(record.amount);
      if (record.type === 'INCOME') {
        monthlyData[month].income += amount;
      } else {
        monthlyData[month].expense += amount;
      }
    });

    // Convert to array format
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  /**
   * Get recent 10 transactions
   */
  static async getRecentActivity(userId?: string, limit: number = 10) {
    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null,
    };

    if (userId) {
      where.userId = userId;
    }

    const records = await prisma.financialRecord.findMany({
      where,
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
        notes: true,
        createdAt: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return records.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      type: r.type,
      category: r.category,
      date: r.date.toISOString(),
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Get top 5 spending categories
   */
  static async getTopSpendingCategories(userId?: string) {
    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null,
      type: 'EXPENSE', // Only expenses for "spending"
    };

    if (userId) {
      where.userId = userId;
    }

    const result = await prisma.financialRecord.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 5,
    });

    return result.map((r) => ({
      category: r.category,
      totalSpent: Number(r._sum.amount),
    }));
  }

  /**
   * Get dashboard stats for a specific user
   * Combines all dashboard data
   */
  static async getDashboardStats(userId?: string) {
    const [summary, categoryBreakdown, monthlyTrends, recentActivity, topCategories] =
      await Promise.all([
        this.getSummary(userId),
        this.getCategoryBreakdown(userId),
        this.getMonthlyTrends(userId),
        this.getRecentActivity(userId, 10),
        this.getTopSpendingCategories(userId),
      ]);

    return {
      summary,
      categoryBreakdown,
      monthlyTrends,
      recentActivity,
      topCategories,
    };
  }
}
