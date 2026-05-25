import { AppError } from '../app-error';
import { AppErrorException } from '../app-error.exception';

export class AuthErrors {
  static INVALID_CREDENTIALS(): AppErrorException {
    return new AppErrorException(
      new AppError(401, 'INVALID_CREDENTIALS', 'A0001', 'Invalid email or password'),
    );
  }

  static USER_NOT_FOUND(id?: string): AppErrorException {
    return new AppErrorException(
      new AppError(404, 'USER_NOT_FOUND', 'A0002', id ? `User with id ${id} not found or inactive` : 'User not found or inactive', id ? { id } : {}),
    );
  }

  static EMAIL_ALREADY_REGISTERED(email: string): AppErrorException {
    return new AppErrorException(
      new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'A0003', `Email ${email} is already registered`, { email }),
    );
  }

  static INVALID_TOKEN(): AppErrorException {
    return new AppErrorException(
      new AppError(401, 'INVALID_TOKEN', 'A0004', 'Token is invalid or expired'),
    );
  }

  static INVALID_REFRESH_TOKEN(): AppErrorException {
    return new AppErrorException(
      new AppError(401, 'INVALID_REFRESH_TOKEN', 'A0005', 'Refresh token is invalid or expired'),
    );
  }

  static USER_INACTIVE(id?: string): AppErrorException {
    return new AppErrorException(
      new AppError(403, 'USER_INACTIVE', 'A0006', id ? `User with id ${id} is inactive` : 'User is inactive', id ? { id } : {}),
    );
  }
}
