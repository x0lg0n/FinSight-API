import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest, AuthPayload } from '../types';
import { ApiError, ErrorFactory } from '../utils/ApiError';

/**
 * JWT verification middleware
 * Extracts and validates JWT token from Authorization header
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ErrorFactory.unauthorized('Authorization header is missing or invalid');
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ErrorFactory.unauthorized('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw ErrorFactory.unauthorized('Invalid token');
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: 'UNAUTHORIZED',
        statusCode: 401,
      });
    }
  }
};

/**
 * Optional authentication middleware
 * Does not throw error if token is missing, but still validates if present
 */
export const authenticateOptional = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without auth
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      req.user = decoded;
    } catch (error) {
      // Invalid token, but don't throw - continue as unauthenticated
    }

    next();
  } catch (error) {
    next();
  }
};
