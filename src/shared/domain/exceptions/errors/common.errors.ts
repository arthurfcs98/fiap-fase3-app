import { AppError } from '../app-error';
import { AppErrorException } from '../app-error.exception';

export class CommonErrors {
  static INTERNAL_ERROR(detail?: string): AppErrorException {
    return new AppErrorException(
      new AppError(500, 'INTERNAL_ERROR', 'X0001', detail || 'An unexpected internal error occurred'),
    );
  }

  static VALIDATION_ERROR(fields?: Record<string, string>): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'VALIDATION_ERROR', 'X0002', 'Invalid data provided', { fields: fields || {} }),
    );
  }

  static UNAUTHORIZED(detail?: string): AppErrorException {
    return new AppErrorException(
      new AppError(401, 'UNAUTHORIZED', 'X0003', detail || 'Authentication required'),
    );
  }

  static FORBIDDEN(detail?: string): AppErrorException {
    return new AppErrorException(
      new AppError(403, 'FORBIDDEN', 'X0004', detail || 'You do not have permission to perform this action'),
    );
  }
}
