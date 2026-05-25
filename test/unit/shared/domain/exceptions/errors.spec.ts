import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { AppError } from '@/shared/domain/exceptions/app-error';
import {
  CommonErrors,
  AuthErrors,
  CustomerErrors,
  VehicleErrors,
  ServiceErrors,
  PartErrors,
  ServiceOrderErrors,
} from '@/shared/domain/exceptions/errors';

describe('AppError', () => {
  it('should create error with all properties', () => {
    const error = new AppError(400, 'TEST_ERROR', 'T0001', 'Test description', { key: 'value' });
    expect(error.httpStatus).toBe(400);
    expect(error.message).toBe('TEST_ERROR');
    expect(error.code).toBe('T0001');
    expect(error.description).toBe('Test description');
    expect(error.metadata).toEqual({ key: 'value' });
  });

  it('should create error with empty metadata by default', () => {
    const error = new AppError(500, 'ERR', 'X0000', 'desc');
    expect(error.metadata).toEqual({});
  });

  it('should produce payload via toPayload()', () => {
    const error = new AppError(404, 'NOT_FOUND', 'X0001', 'Not found', { id: '123' });
    const payload = error.toPayload();
    expect(payload).toEqual({
      message: 'NOT_FOUND',
      code: 'X0001',
      description: 'Not found',
      metadata: { id: '123' },
    });
  });
});

describe('AppErrorException', () => {
  it('should be an HttpException with appError', () => {
    const appError = new AppError(409, 'CONFLICT', 'X0009', 'Conflict');
    const exception = new AppErrorException(appError);
    expect(exception).toBeInstanceOf(AppErrorException);
    expect(exception.getStatus()).toBe(409);
    expect(exception.appError).toBe(appError);
  });
});

describe('CommonErrors', () => {
  it('INTERNAL_ERROR', () => {
    const err = CommonErrors.INTERNAL_ERROR();
    expect(err).toBeInstanceOf(AppErrorException);
    expect(err.appError.code).toBe('X0001');
    expect(err.appError.httpStatus).toBe(500);
  });

  it('INTERNAL_ERROR with detail', () => {
    const err = CommonErrors.INTERNAL_ERROR('DB connection failed');
    expect(err.appError.description).toBe('DB connection failed');
  });

  it('VALIDATION_ERROR', () => {
    const err = CommonErrors.VALIDATION_ERROR({ email: 'invalid' });
    expect(err.appError.code).toBe('X0002');
    expect(err.appError.httpStatus).toBe(400);
    expect(err.appError.metadata).toEqual({ fields: { email: 'invalid' } });
  });

  it('VALIDATION_ERROR without fields', () => {
    const err = CommonErrors.VALIDATION_ERROR();
    expect(err.appError.metadata).toEqual({ fields: {} });
  });

  it('UNAUTHORIZED', () => {
    const err = CommonErrors.UNAUTHORIZED();
    expect(err.appError.code).toBe('X0003');
    expect(err.appError.httpStatus).toBe(401);
  });

  it('UNAUTHORIZED with detail', () => {
    const err = CommonErrors.UNAUTHORIZED('Token expired');
    expect(err.appError.description).toBe('Token expired');
  });

  it('FORBIDDEN', () => {
    const err = CommonErrors.FORBIDDEN();
    expect(err.appError.code).toBe('X0004');
    expect(err.appError.httpStatus).toBe(403);
  });

  it('FORBIDDEN with detail', () => {
    const err = CommonErrors.FORBIDDEN('Admin only');
    expect(err.appError.description).toBe('Admin only');
  });
});

describe('AuthErrors', () => {
  it('INVALID_CREDENTIALS', () => {
    const err = AuthErrors.INVALID_CREDENTIALS();
    expect(err.appError.code).toBe('A0001');
    expect(err.appError.httpStatus).toBe(401);
  });

  it('USER_NOT_FOUND without id', () => {
    const err = AuthErrors.USER_NOT_FOUND();
    expect(err.appError.code).toBe('A0002');
    expect(err.appError.metadata).toEqual({});
  });

  it('USER_NOT_FOUND with id', () => {
    const err = AuthErrors.USER_NOT_FOUND('uuid-123');
    expect(err.appError.description).toContain('uuid-123');
    expect(err.appError.metadata).toEqual({ id: 'uuid-123' });
  });

  it('EMAIL_ALREADY_REGISTERED', () => {
    const err = AuthErrors.EMAIL_ALREADY_REGISTERED('test@test.com');
    expect(err.appError.code).toBe('A0003');
    expect(err.appError.metadata).toEqual({ email: 'test@test.com' });
  });

  it('INVALID_TOKEN', () => {
    const err = AuthErrors.INVALID_TOKEN();
    expect(err.appError.code).toBe('A0004');
    expect(err.appError.httpStatus).toBe(401);
  });

  it('INVALID_REFRESH_TOKEN', () => {
    const err = AuthErrors.INVALID_REFRESH_TOKEN();
    expect(err.appError.code).toBe('A0005');
  });

  it('USER_INACTIVE without id', () => {
    const err = AuthErrors.USER_INACTIVE();
    expect(err.appError.code).toBe('A0006');
    expect(err.appError.httpStatus).toBe(403);
  });

  it('USER_INACTIVE with id', () => {
    const err = AuthErrors.USER_INACTIVE('uuid-456');
    expect(err.appError.description).toContain('uuid-456');
  });
});

describe('CustomerErrors', () => {
  it('NOT_FOUND without id', () => {
    const err = CustomerErrors.NOT_FOUND();
    expect(err.appError.code).toBe('C0001');
  });

  it('NOT_FOUND with id', () => {
    const err = CustomerErrors.NOT_FOUND('c-123');
    expect(err.appError.metadata).toEqual({ id: 'c-123' });
  });

  it('ALREADY_EXISTS', () => {
    const err = CustomerErrors.ALREADY_EXISTS('12345678901');
    expect(err.appError.code).toBe('C0002');
  });

  it('HAS_ORDERS', () => {
    const err = CustomerErrors.HAS_ORDERS('c-123');
    expect(err.appError.code).toBe('C0003');
  });

  it('INVALID_DOCUMENT', () => {
    const err = CustomerErrors.INVALID_DOCUMENT('000');
    expect(err.appError.code).toBe('C0004');
  });

  it('INVALID_CPF', () => {
    const err = CustomerErrors.INVALID_CPF('111');
    expect(err.appError.code).toBe('C0005');
  });

  it('INVALID_CNPJ', () => {
    const err = CustomerErrors.INVALID_CNPJ('222');
    expect(err.appError.code).toBe('C0006');
  });

  it('INVALID_EMAIL', () => {
    const err = CustomerErrors.INVALID_EMAIL('bad');
    expect(err.appError.code).toBe('C0007');
  });
});

describe('VehicleErrors', () => {
  it('NOT_FOUND without id', () => {
    const err = VehicleErrors.NOT_FOUND();
    expect(err.appError.code).toBe('V0001');
  });

  it('NOT_FOUND with id', () => {
    const err = VehicleErrors.NOT_FOUND('v-123');
    expect(err.appError.metadata).toEqual({ id: 'v-123' });
  });

  it('PLATE_ALREADY_EXISTS', () => {
    const err = VehicleErrors.PLATE_ALREADY_EXISTS('ABC1234');
    expect(err.appError.code).toBe('V0002');
    expect(err.appError.metadata).toEqual({ licensePlate: 'ABC1234' });
  });

  it('NOT_OWNED_BY_CUSTOMER', () => {
    const err = VehicleErrors.NOT_OWNED_BY_CUSTOMER('v1', 'c1');
    expect(err.appError.code).toBe('V0003');
  });

  it('INVALID_LICENSE_PLATE', () => {
    const err = VehicleErrors.INVALID_LICENSE_PLATE('XXX');
    expect(err.appError.code).toBe('V0004');
  });
});

describe('ServiceErrors', () => {
  it('NOT_FOUND without id', () => {
    const err = ServiceErrors.NOT_FOUND();
    expect(err.appError.code).toBe('S0001');
  });

  it('NOT_FOUND with id', () => {
    const err = ServiceErrors.NOT_FOUND('s-123');
    expect(err.appError.metadata).toEqual({ id: 's-123' });
  });

  it('CODE_ALREADY_EXISTS', () => {
    const err = ServiceErrors.CODE_ALREADY_EXISTS('REV01');
    expect(err.appError.code).toBe('S0002');
    expect(err.appError.metadata).toEqual({ code: 'REV01' });
  });
});

describe('PartErrors', () => {
  it('NOT_FOUND without id', () => {
    const err = PartErrors.NOT_FOUND();
    expect(err.appError.code).toBe('P0001');
  });

  it('NOT_FOUND with id', () => {
    const err = PartErrors.NOT_FOUND('p-123');
    expect(err.appError.metadata).toEqual({ id: 'p-123' });
  });

  it('CODE_ALREADY_EXISTS', () => {
    const err = PartErrors.CODE_ALREADY_EXISTS('OIL01');
    expect(err.appError.code).toBe('P0002');
  });

  it('INSUFFICIENT_STOCK', () => {
    const err = PartErrors.INSUFFICIENT_STOCK('p-1', 10, 3);
    expect(err.appError.code).toBe('P0003');
    expect(err.appError.metadata).toEqual({ partId: 'p-1', requested: 10, available: 3 });
  });

  it('NEGATIVE_STOCK', () => {
    const err = PartErrors.NEGATIVE_STOCK();
    expect(err.appError.code).toBe('P0004');
  });

  it('STOCK_RESERVATION_FAILED', () => {
    const err = PartErrors.STOCK_RESERVATION_FAILED('p-1');
    expect(err.appError.code).toBe('P0005');
    expect(err.appError.httpStatus).toBe(500);
  });
});

describe('ServiceOrderErrors', () => {
  it('NOT_FOUND without id', () => {
    const err = ServiceOrderErrors.NOT_FOUND();
    expect(err.appError.code).toBe('O0001');
  });

  it('NOT_FOUND with id', () => {
    const err = ServiceOrderErrors.NOT_FOUND('o-123');
    expect(err.appError.metadata).toEqual({ id: 'o-123' });
  });

  it('ITEM_NOT_FOUND', () => {
    const err = ServiceOrderErrors.ITEM_NOT_FOUND('item-1');
    expect(err.appError.code).toBe('O0002');
  });

  it('INVALID_STATUS_TRANSITION', () => {
    const err = ServiceOrderErrors.INVALID_STATUS_TRANSITION('RECEIVED', 'COMPLETED');
    expect(err.appError.code).toBe('O0003');
    expect(err.appError.metadata).toEqual({ from: 'RECEIVED', to: 'COMPLETED' });
  });

  it('CANNOT_MODIFY_IN_STATUS', () => {
    const err = ServiceOrderErrors.CANNOT_MODIFY_IN_STATUS('COMPLETED');
    expect(err.appError.code).toBe('O0004');
  });

  it('NOT_AWAITING_APPROVAL without orderNumber', () => {
    const err = ServiceOrderErrors.NOT_AWAITING_APPROVAL();
    expect(err.appError.code).toBe('O0005');
  });

  it('NOT_AWAITING_APPROVAL with orderNumber', () => {
    const err = ServiceOrderErrors.NOT_AWAITING_APPROVAL('OS-2024-00001');
    expect(err.appError.metadata).toEqual({ orderNumber: 'OS-2024-00001' });
  });

  it('ORDER_BY_NUMBER_NOT_FOUND', () => {
    const err = ServiceOrderErrors.ORDER_BY_NUMBER_NOT_FOUND('OS-2024-00001');
    expect(err.appError.code).toBe('O0006');
    expect(err.appError.metadata).toEqual({ orderNumber: 'OS-2024-00001' });
  });
});
