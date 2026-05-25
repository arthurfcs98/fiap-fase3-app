import { ICustomerRepository } from '@/modules/customer/domain/repositories/customer.repository.interface';

export const createMockCustomerRepository =
  (): jest.Mocked<ICustomerRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByDocument: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });
