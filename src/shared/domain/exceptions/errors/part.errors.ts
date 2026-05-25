import { AppError } from '../app-error';
import { AppErrorException } from '../app-error.exception';

export class PartErrors {
  static NOT_FOUND(id?: string): AppErrorException {
    return new AppErrorException(
      new AppError(404, 'PART_NOT_FOUND', 'P0001', id ? `Part with id ${id} not found` : 'Part not found', id ? { id } : {}),
    );
  }

  static CODE_ALREADY_EXISTS(code: string): AppErrorException {
    return new AppErrorException(
      new AppError(409, 'PART_CODE_ALREADY_EXISTS', 'P0002', `Part with code ${code} already exists`, { code }),
    );
  }

  static INSUFFICIENT_STOCK(partId: string, requested?: number, available?: number): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'INSUFFICIENT_STOCK', 'P0003', `Insufficient stock for part ${partId}`, { partId, requested, available }),
    );
  }

  static NEGATIVE_STOCK(): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'NEGATIVE_STOCK', 'P0004', 'Stock quantity cannot be negative'),
    );
  }

  static STOCK_RESERVATION_FAILED(partId: string): AppErrorException {
    return new AppErrorException(
      new AppError(500, 'STOCK_RESERVATION_FAILED', 'P0005', `Failed to reserve stock for part ${partId}`, { partId }),
    );
  }
}
