/**
 * Custom API Error class
 * Encapsulates HTTP status codes with error messages for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errorCode?: string,
  ) {
    super(message);
    this.name = 'ApiError';

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      error: this.errorCode || this.name,
      statusCode: this.statusCode,
    };
  }
}

// Common error factory functions
export const ErrorFactory = {
  badRequest: (message: string, code?: string) =>
    new ApiError(400, message, code || 'BAD_REQUEST'),

  unauthorized: (message: string = 'Unauthorized', code?: string) =>
    new ApiError(401, message, code || 'UNAUTHORIZED'),

  forbidden: (message: string = 'Insufficient permissions', code?: string) =>
    new ApiError(403, message, code || 'FORBIDDEN'),

  notFound: (message: string = 'Resource not found', code?: string) =>
    new ApiError(404, message, code || 'NOT_FOUND'),

  conflict: (message: string, code?: string) =>
    new ApiError(409, message, code || 'CONFLICT'),

  internal: (message: string = 'Internal server error', code?: string) =>
    new ApiError(500, message, code || 'INTERNAL_ERROR'),
};
