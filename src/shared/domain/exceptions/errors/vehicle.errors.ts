import { AppError } from '../app-error';
import { AppErrorException } from '../app-error.exception';

export class VehicleErrors {
  static NOT_FOUND(id?: string): AppErrorException {
    return new AppErrorException(
      new AppError(404, 'VEHICLE_NOT_FOUND', 'V0001', id ? `Vehicle with id ${id} not found` : 'Vehicle not found', id ? { id } : {}),
    );
  }

  static PLATE_ALREADY_EXISTS(licensePlate: string): AppErrorException {
    return new AppErrorException(
      new AppError(409, 'VEHICLE_PLATE_ALREADY_EXISTS', 'V0002', `Vehicle with license plate ${licensePlate} already exists`, { licensePlate }),
    );
  }

  static NOT_OWNED_BY_CUSTOMER(vehicleId: string, customerId: string): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'VEHICLE_NOT_OWNED_BY_CUSTOMER', 'V0003', `Vehicle ${vehicleId} does not belong to customer ${customerId}`, { vehicleId, customerId }),
    );
  }

  static INVALID_LICENSE_PLATE(licensePlate: string): AppErrorException {
    return new AppErrorException(
      new AppError(400, 'INVALID_LICENSE_PLATE', 'V0004', `License plate ${licensePlate} is not valid`, { licensePlate }),
    );
  }
}
