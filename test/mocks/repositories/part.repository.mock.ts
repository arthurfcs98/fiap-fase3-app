import { IPartRepository } from '@/modules/part/domain/repositories/part.repository.interface';

export const createMockPartRepository = (): jest.Mocked<IPartRepository> => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  findByIds: jest.fn(),
  findLowStock: jest.fn(),
  update: jest.fn(),
  updateStock: jest.fn(),
  delete: jest.fn(),
});
