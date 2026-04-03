import { RecordType, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ErrorFactory } from '../../utils/ApiError';

export interface CreateRecordInput {
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  notes?: string;
}

export interface UpdateRecordInput {
  amount?: number;
  type?: RecordType;
  category?: string;
  date?: Date;
  notes?: string;
}

export interface ListRecordsFilters {
  userId?: string;
  type?: RecordType;
  category?: string;
  from?: Date;
  to?: Date;
  search?: string;
  page?: number;
  limit?: number;
  viewersOwnOnly?: boolean;
}

/**
 * Financial Records service
 * Handles CRUD operations for financial records with filtering and soft delete
 */
export class RecordsService {
  /**
   * Create a new financial record
   */
  static async createRecord(userId: string, input: CreateRecordInput) {
    const { amount, type, category, date, notes } = input;

    // Validate amount
    if (amount <= 0) {
      throw ErrorFactory.badRequest('Amount must be greater than 0', 'INVALID_AMOUNT');
    }

    const record = await prisma.financialRecord.create({
      data: {
        amount: new Prisma.Decimal(amount),
        type,
        category: category.trim(),
        date,
        notes: notes?.trim() || null,
        userId,
      },
    });

    return this.formatRecord(record);
  }

  /**
   * Get records with filters and pagination
   * Excludes soft-deleted records by default
   */
  static async listRecords(filters: ListRecordsFilters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null, // Exclude soft-deleted records
    };

    // Filter by userId if provided
    if (filters.userId || filters.viewersOwnOnly) {
      where.userId = filters.userId || undefined;
    }

    // Filter by type
    if (filters.type) {
      where.type = filters.type;
    }

    // Filter by category (case-insensitive partial match)
    if (filters.category) {
      where.category = {
        contains: filters.category,
        mode: 'insensitive',
      };
    }

    // Filter by date range
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) {
        where.date.gte = filters.from;
      }
      if (filters.to) {
        where.date.lte = filters.to;
      }
    }

    // Full-text search on notes and category
    if (filters.search) {
      where.OR = [
        {
          category: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          notes: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Execute queries in parallel
    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return {
      records: records.map((r) => this.formatRecord(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single record by ID
   */
  static async getRecordById(recordId: string) {
    const record = await prisma.financialRecord.findFirst({
      where: {
        id: recordId,
        deletedAt: null, // Exclude soft-deleted
      },
    });

    if (!record) {
      throw ErrorFactory.notFound('Record not found', 'RECORD_NOT_FOUND');
    }

    return this.formatRecord(record);
  }

  /**
   * Update a record
   */
  static async updateRecord(recordId: string, input: UpdateRecordInput) {
    // Check if record exists and is not soft-deleted
    const existing = await prisma.financialRecord.findFirst({
      where: {
        id: recordId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw ErrorFactory.notFound('Record not found', 'RECORD_NOT_FOUND');
    }

    // Validate amount if provided
    if (input.amount !== undefined && input.amount <= 0) {
      throw ErrorFactory.badRequest('Amount must be greater than 0', 'INVALID_AMOUNT');
    }

    const data: Prisma.FinancialRecordUpdateInput = {};

    if (input.amount !== undefined) {
      data.amount = new Prisma.Decimal(input.amount);
    }
    if (input.type !== undefined) {
      data.type = input.type;
    }
    if (input.category !== undefined) {
      data.category = input.category.trim();
    }
    if (input.date !== undefined) {
      data.date = input.date;
    }
    if (input.notes !== undefined) {
      data.notes = input.notes.trim() || null;
    }

    const record = await prisma.financialRecord.update({
      where: { id: recordId },
      data,
    });

    return this.formatRecord(record);
  }

  /**
   * Soft delete a record
   */
  static async deleteRecord(recordId: string) {
    // Check if record exists and is not already soft-deleted
    const existing = await prisma.financialRecord.findFirst({
      where: {
        id: recordId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw ErrorFactory.notFound('Record not found', 'RECORD_NOT_FOUND');
    }

    const record = await prisma.financialRecord.update({
      where: { id: recordId },
      data: {
        deletedAt: new Date(),
      },
    });

    return this.formatRecord(record);
  }

  /**
   * Format record for API response
   * Converts Decimal to number and formats timestamps
   */
  private static formatRecord(record: any) {
    return {
      id: record.id,
      amount: Number(record.amount),
      type: record.type,
      category: record.category,
      date: record.date.toISOString(),
      notes: record.notes,
      userId: record.userId,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
