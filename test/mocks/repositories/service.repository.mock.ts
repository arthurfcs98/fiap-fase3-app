import { IServiceRepository } from '@/modules/service/domain/repositories/service.repository.interface';

export const createMockServiceRepository =
  (): jest.Mocked<IServiceRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });
