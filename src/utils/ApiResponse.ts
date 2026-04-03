import { Response } from 'express';
import { ApiResponseType, PaginationMeta } from '../types';

/**
 * Sends a standardized API response
 */
export class ApiResponse {
  static success<T = any>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    pagination?: PaginationMeta,
  ) {
    const response: ApiResponseType<T> = {
      success: true,
      message,
      data,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    errorCode?: string,
  ) {
    const response: ApiResponseType = {
      success: false,
      message,
      error: errorCode || 'ERROR',
      statusCode,
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
  ) {
    return this.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message: string = 'Records fetched successfully',
    statusCode: number = 200,
  ) {
    const response: ApiResponseType<T[]> = {
      success: true,
      message,
      data,
      pagination,
    };

    return res.status(statusCode).json(response);
  }
}
