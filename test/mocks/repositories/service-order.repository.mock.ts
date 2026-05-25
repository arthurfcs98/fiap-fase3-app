import { IServiceOrderRepository } from '@/modules/service-order/domain/repositories/service-order.repository.interface';

export const createMockServiceOrderRepository =
  (): jest.Mocked<IServiceOrderRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByOrderNumber: jest.fn(),
    update: jest.fn(),
    getNextOrderNumber: jest.fn(),
    recalculateTotal: jest.fn(),
    getOrderCountByStatus: jest.fn(),
    getAverageCompletionTime: jest.fn(),
    getTotalRevenue: jest.fn(),
    getOrdersCountByDateRange: jest.fn(),
    getCompletedOrdersCountByDateRange: jest.fn(),
  });
