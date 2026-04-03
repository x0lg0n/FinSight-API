import { Response } from 'express';
import { AuthRequest } from '../../types';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../middleware/errorHandler';
import { DashboardService } from './dashboard.service';

/**
 * Dashboard controller
 * Handles HTTP requests for dashboard analytics endpoints
 */
export class DashboardController {
  /**
   * Get dashboard summary (income, expenses, balance)
   */
  static getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    // If analyst or admin, they can see all data; otherwise only their own
    const userId = req.user.role === 'ANALYST' || req.user.role === 'ADMIN' 
      ? undefined 
      : req.user.userId;

    const summary = await DashboardService.getSummary(userId);
    ApiResponse.success(res, summary, 'Dashboard summary retrieved successfully');
  });

  /**
   * Get category breakdown
   */
  static getCategoryBreakdown = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const userId = req.user.role === 'ANALYST' || req.user.role === 'ADMIN' 
      ? undefined 
      : req.user.userId;

    const breakdown = await DashboardService.getCategoryBreakdown(userId);
    ApiResponse.success(res, breakdown, 'Category breakdown retrieved successfully');
  });

  /**
   * Get monthly trends
   */
  static getMonthlyTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const userId = req.user.role === 'ANALYST' || req.user.role === 'ADMIN' 
      ? undefined 
      : req.user.userId;

    const trends = await DashboardService.getMonthlyTrends(userId);
    ApiResponse.success(res, trends, 'Monthly trends retrieved successfully');
  });

  /**
   * Get recent activity
   */
  static getRecentActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const userId = req.user.role === 'ANALYST' || req.user.role === 'ADMIN' 
      ? undefined 
      : req.user.userId;

    const activity = await DashboardService.getRecentActivity(userId, 10);
    ApiResponse.success(res, activity, 'Recent activity retrieved successfully');
  });

  /**
   * Get top spending categories
   */
  static getTopCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const userId = req.user.role === 'ANALYST' || req.user.role === 'ADMIN' 
      ? undefined 
      : req.user.userId;

    const topCategories = await DashboardService.getTopSpendingCategories(userId);
    ApiResponse.success(res, topCategories, 'Top spending categories retrieved successfully');
  });

  /**
   * Get complete dashboard stats (combined)
   */
  static getFullDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const userId = req.user.role === 'ANALYST' || req.user.role === 'ADMIN' 
      ? undefined 
      : req.user.userId;

    const stats = await DashboardService.getDashboardStats(userId);
    ApiResponse.success(res, stats, 'Dashboard data retrieved successfully');
  });
}
