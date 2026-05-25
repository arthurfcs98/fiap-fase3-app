import { AppError } from '../app-error';
import { AppErrorException } from '../app-error.exception';

export class ServiceOrderErrors {
  static NOT_FOUND(id?: string): AppErrorException {
    return new AppErrorException(
      new AppError(404, 'SERVICE_ORDER_NOT_FOUND', 'O0001', id ? `Service order with id ${id} not found` : 'Service order not found', id ? { id } : {}),
    );
  }

  static ITEM_NOT_FOUND(itemId: string): AppErrorException {
    return new AppErrorException(
      new AppError(404, 'SERVICE_ORDER_ITEM_NOT_FOUND', 'O0002', `Service order item with id ${itemId} not found`, { itemId }),
    );
  }

  static INVALID_STATUS_TRANSITION(from: string, to: string): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'INVALID_STATUS_TRANSITION', 'O0003', `Cannot transition from ${from} to ${to}`, { from, to }),
    );
  }

  static CANNOT_MODIFY_IN_STATUS(status: string): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'CANNOT_MODIFY_ORDER_IN_STATUS', 'O0004', `Cannot modify order while in status ${status}`, { status }),
    );
  }

  static NOT_AWAITING_APPROVAL(orderNumber?: string): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'ORDER_NOT_AWAITING_APPROVAL', 'O0005', orderNumber ? `Order ${orderNumber} is not awaiting approval` : 'Order is not awaiting approval', orderNumber ? { orderNumber } : {}),
    );
  }

  static ORDER_BY_NUMBER_NOT_FOUND(orderNumber: string): AppErrorException {
    return new AppErrorException(
      new AppError(404, 'SERVICE_ORDER_NOT_FOUND', 'O0006', `Service order with number ${orderNumber} not found`, { orderNumber }),
    );
  }
}
