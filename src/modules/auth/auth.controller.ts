import { Response } from 'express';
import { AuthRequest } from '../../types';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../middleware/errorHandler';
import { AuthService } from './auth.service';

/**
 * Authentication controller
 * Handles HTTP requests for auth endpoints
 */
export class AuthController {
  /**
   * Register new user
   */
  static register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, name } = req.body;

    const result = await AuthService.register({ email, password, name });

    ApiResponse.created(res, result, 'User registered successfully');
  });

  /**
   * Login user
   */
  static login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await AuthService.login({ email, password });

    ApiResponse.success(res, result, 'Login successful');
  });

  /**
   * Get current user profile
   */
  static getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await AuthService.getCurrentUser(req.user.userId);

    ApiResponse.success(res, user, 'User profile retrieved successfully');
  });
}
