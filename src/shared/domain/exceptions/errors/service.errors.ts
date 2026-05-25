import { AppError } from '../app-error';
import { AppErrorException } from '../app-error.exception';

export class ServiceErrors {
  static NOT_FOUND(id?: string): AppErrorException {
    return new AppErrorException(
      new AppError(404, 'SERVICE_NOT_FOUND', 'S0001', id ? `Service with id ${id} not found` : 'Service not found', id ? { id } : {}),
    );
  }

  static CODE_ALREADY_EXISTS(code: string): AppErrorException {
    return new AppErrorException(
      new AppError(409, 'SERVICE_CODE_ALREADY_EXISTS', 'S0002', `Service with code ${code} already exists`, { code }),
    );
  }
}
