import { Response } from 'express';
import { RecordType } from '@prisma/client';
import { AuthRequest } from '../../types';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../middleware/errorHandler';
import { RecordsService } from './records.service';

/**
 * Financial Records controller
 * Handles HTTP requests for record management endpoints
 */
export class RecordsController {
  /**
   * List all records (with filters and pagination)
   * Analysts and Admins can see all records
   */
  static listAllRecords = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const type = req.query.type as RecordType | undefined;
    const category = req.query.category as string | undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const search = req.query.search as string | undefined;

    const result = await RecordsService.listRecords({
      page,
      limit,
      type,
      category,
      from,
      to,
      search,
    });

    ApiResponse.paginated(res, result.records, result.pagination, 'Records retrieved successfully');
  });

  /**
   * List user's own records
   */
  static listOwnRecords = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const type = req.query.type as RecordType | undefined;
    const category = req.query.category as string | undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const search = req.query.search as string | undefined;

    const result = await RecordsService.listRecords({
      userId: req.user.userId,
      page,
      limit,
      type,
      category,
      from,
      to,
      search,
      viewersOwnOnly: true,
    });

    ApiResponse.paginated(res, result.records, result.pagination, 'Your records retrieved successfully');
  });

  /**
   * Get single record by ID
   */
  static getRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const record = await RecordsService.getRecordById(id);
    ApiResponse.success(res, record, 'Record retrieved successfully');
  });

  /**
   * Create new record
   */
  static createRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { amount, type, category, date, notes } = req.body;

    const record = await RecordsService.createRecord(req.user.userId, {
      amount,
      type,
      category,
      date: new Date(date),
      notes,
    });

    ApiResponse.created(res, record, 'Record created successfully');
  });

  /**
   * Update record
   */
  static updateRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const { amount, type, category, date, notes } = req.body;

    const record = await RecordsService.updateRecord(id, {
      amount,
      type,
      category,
      date: date ? new Date(date) : undefined,
      notes,
    });

    ApiResponse.success(res, record, 'Record updated successfully');
  });

  /**
   * Delete record (soft delete)
   */
  static deleteRecord = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const record = await RecordsService.deleteRecord(id);
    ApiResponse.success(res, record, 'Record deleted successfully');
  });
}
