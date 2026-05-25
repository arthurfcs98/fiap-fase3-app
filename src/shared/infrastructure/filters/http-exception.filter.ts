import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle AppErrorException (new structured errors)
    if (exception instanceof AppErrorException) {
      const appError = exception.appError;
      return response.status(appError.httpStatus).json({
        statusCode: appError.httpStatus,
        error: appError.toPayload(),
        timestamp: new Date().toISOString(),
      });
    }

    // Handle standard HttpExceptions (validation errors, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;

        // Class-validator validation errors
        if (Array.isArray(responseObj.message)) {
          return response.status(status).json({
            statusCode: status,
            error: {
              message: 'VALIDATION_ERROR',
              code: 'X0002',
              description: 'Invalid data provided',
              metadata: { fields: responseObj.message },
            },
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Generic HttpException
      const message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>).message || 'An error occurred';

      return response.status(status).json({
        statusCode: status,
        error: {
          message: 'HTTP_ERROR',
          code: `X${String(status).padStart(4, '0')}`,
          description: message as string,
          metadata: {},
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Unhandled exceptions
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: {
        message: 'INTERNAL_ERROR',
        code: 'X0001',
        description: 'An unexpected internal error occurred',
        metadata: {},
      },
      timestamp: new Date().toISOString(),
    });
  }
}
