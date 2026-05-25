import { IVehicleRepository } from '@/modules/vehicle/domain/repositories/vehicle.repository.interface';

export const createMockVehicleRepository =
  (): jest.Mocked<IVehicleRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByLicensePlate: jest.fn(),
    findByCustomerId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });
