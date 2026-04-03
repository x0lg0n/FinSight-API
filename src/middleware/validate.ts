import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Validation error collector middleware
 * Gathers all validation errors from express-validator and returns them together
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      statusCode: 400,
      details: errorMessages,
    });
    return;
  }

  next();
};

export const collectValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      if (err.type === 'field') {
        return {
          field: err.path,
          message: err.msg,
        };
      }
      return {
        field: 'unknown',
        message: err.msg,
      };
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      statusCode: 400,
      details: errorMessages,
    });
    return;
  }

  next();
};
