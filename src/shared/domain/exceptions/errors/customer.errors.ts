import { AppError } from '../app-error';
import { AppErrorException } from '../app-error.exception';

export class CustomerErrors {
  static NOT_FOUND(id?: string): AppErrorException {
    return new AppErrorException(
      new AppError(404, 'CUSTOMER_NOT_FOUND', 'C0001', id ? `Customer with id ${id} not found` : 'Customer not found', id ? { id } : {}),
    );
  }

  static ALREADY_EXISTS(document: string): AppErrorException {
    return new AppErrorException(
      new AppError(409, 'CUSTOMER_ALREADY_EXISTS', 'C0002', `Customer with document ${document} already exists`, { document }),
    );
  }

  static HAS_ORDERS(id: string): AppErrorException {
    return new AppErrorException(
      new AppError(409, 'CUSTOMER_HAS_ORDERS', 'C0003', `Customer with id ${id} has linked service orders`, { id }),
    );
  }

  static INVALID_DOCUMENT(document: string): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'INVALID_DOCUMENT', 'C0004', `Document ${document} is invalid`, { document }),
    );
  }

  static INVALID_CPF(cpf: string): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'INVALID_CPF', 'C0005', `CPF ${cpf} is invalid`, { cpf }),
    );
  }

  static INVALID_CNPJ(cnpj: string): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'INVALID_CNPJ', 'C0006', `CNPJ ${cnpj} is invalid`, { cnpj }),
    );
  }

  static INVALID_EMAIL(email: string): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'INVALID_EMAIL', 'C0007', `Email ${email} is not a valid email address`, { email }),
    );
  }
}
