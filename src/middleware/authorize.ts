import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types';
import { ErrorFactory } from '../utils/ApiError';

/**
 * Role-based authorization guard
 * Checks if the authenticated user has one of the required roles
 */
export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // User should be authenticated first by authenticate middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - User not authenticated',
        error: 'UNAUTHORIZED',
        statusCode: 401,
      });
      return;
    }

    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      res
        .status(403)
        .json(ErrorFactory.forbidden('Insufficient permissions for this action').toJSON());
      return;
    }

    next();
  };
};

/**
 * Ensures user can only access their own data
 * Admin can access any user's data
 */
export const ownerOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'UNAUTHORIZED',
      statusCode: 401,
    });
    return;
  }

  const targetUserId = req.params.userId;
  const isOwner = req.user.userId === targetUserId;
  const isAdmin = req.user.role === Role.ADMIN;

  if (!isOwner && !isAdmin) {
    res.status(403).json(ErrorFactory.forbidden('You can only access your own data').toJSON());
    return;
  }

  next();
};

export const authorize = { requireRole, ownerOrAdmin };
