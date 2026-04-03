import { Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types';

/**
 * Global error handler middleware
 * Catches all errors and returns a consistent error response
 */
export const errorHandler: ErrorRequestHandler = (
  error: Error | ApiError,
  _req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  console.error('Error caught by global handler:', error);

  if (error instanceof ApiError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // Handle validation errors from express-validator
  if (error.message && error.message.includes('validation')) {
    res.status(400).json({
      success: false,
      message: error.message,
      error: 'VALIDATION_ERROR',
      statusCode: 400,
    });
    return;
  }

  // Default 500 error
  const statusCode = (error as any).statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    error: 'INTERNAL_ERROR',
    statusCode,
  });
  return;
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler =
  (fn: Function) => (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
