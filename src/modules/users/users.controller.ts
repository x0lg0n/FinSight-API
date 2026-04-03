import { Response } from 'express';
import { AuthRequest } from '../../types';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../middleware/errorHandler';
import { UsersService } from './users.service';

/**
 * Users controller
 * Handles HTTP requests for user management endpoints
 */
export class UsersController {
  /**
   * List all users
   */
  static listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await UsersService.listUsers({ page, limit });

    ApiResponse.paginated(res, result.users, result.pagination, 'Users retrieved successfully');
  });

  /**
   * Get user by ID
   */
  static getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const user = await UsersService.getUserById(id);
    ApiResponse.success(res, user, 'User retrieved successfully');
  });

  /**
   * Update user role
   */
  static updateRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const { role } = req.body;

    const user = await UsersService.updateUserRole(id, role);
    ApiResponse.success(res, user, 'User role updated successfully');
  });

  /**
   * Update user status
   */
  static updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const { isActive } = req.body;

    const user = await UsersService.updateUserStatus(id, isActive);
    ApiResponse.success(res, user, 'User status updated successfully');
  });

  /**
   * Delete user (deactivate)
   */
  static deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const user = await UsersService.deleteUser(id);
    ApiResponse.success(res, user, 'User deactivated successfully');
  });
}
