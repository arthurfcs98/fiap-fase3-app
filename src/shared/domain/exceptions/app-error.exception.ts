import { HttpException } from '@nestjs/common';
import { AppError } from './app-error';

export class AppErrorException extends HttpException {
  public readonly appError: AppError;

  constructor(appError: AppError) {
    super(
      {
        error: appError.toPayload(),
      },
      appError.httpStatus,
    );
    this.appError = appError;
  }
}
