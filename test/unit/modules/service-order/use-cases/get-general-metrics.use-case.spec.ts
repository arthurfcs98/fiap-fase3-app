import { Test, TestingModule } from '@nestjs/testing';
import { GetGeneralMetricsUseCase } from '@/modules/service-order/application/use-cases/get-general-metrics/get-general-metrics.use-case';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { SERVICE_ORDER_STATUS_HISTORY_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order-status-history.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';

describe('GetGeneralMetricsUseCase', () => {
  let useCase: GetGeneralMetricsUseCase;

  const mockOrdersByStatus: Record<string, number> = {
    [ServiceOrderStatus.RECEIVED]: 5,
    [ServiceOrderStatus.IN_DIAGNOSIS]: 3,
    [ServiceOrderStatus.AWAITING_APPROVAL]: 2,
    [ServiceOrderStatus.AWAITING_START]: 1,
    [ServiceOrderStatus.IN_PROGRESS]: 4,
    [ServiceOrderStatus.COMPLETED]: 10,
    [ServiceOrderStatus.DELIVERED]: 15,
    [ServiceOrderStatus.CANCELLED]: 2,
  };

  const mockAverageTimeByStatus: Record<string, number> = {
    [ServiceOrderStatus.RECEIVED]: 30,
    [ServiceOrderStatus.IN_DIAGNOSIS]: 60,
    [ServiceOrderStatus.AWAITING_APPROVAL]: 120,
    [ServiceOrderStatus.AWAITING_START]: 15,
    [ServiceOrderStatus.IN_PROGRESS]: 180,
    [ServiceOrderStatus.COMPLETED]: 10,
    [ServiceOrderStatus.DELIVERED]: 0,
    [ServiceOrderStatus.CANCELLED]: 0,
  };

  const mockServiceOrderRepository = {
    getOrderCountByStatus: jest.fn().mockResolvedValue(mockOrdersByStatus),
    getAverageCompletionTime: jest.fn().mockResolvedValue(240),
    getTotalRevenue: jest.fn().mockResolvedValue(25000),
    getOrdersCountByDateRange: jest.fn().mockResolvedValue(5),
    getCompletedOrdersCountByDateRange: jest.fn().mockResolvedValue(3),
  };

  const mockStatusHistoryRepository = {
    getAverageTimeByStatus: jest.fn().mockResolvedValue(mockAverageTimeByStatus),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetGeneralMetricsUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
        {
          provide: SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
          useValue: mockStatusHistoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetGeneralMetricsUseCase>(GetGeneralMetricsUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return general metrics for all service orders', async () => {
      const result = await useCase.execute();

      expect(result.totalOrders).toBe(42); // Sum of all statuses
      expect(result.ordersByStatus).toEqual(mockOrdersByStatus);
      expect(result.averageCompletionTimeMinutes).toBe(240);
      expect(result.averageTimeByStatus).toEqual(mockAverageTimeByStatus);
      expect(result.totalRevenue).toBe(25000);
      expect(result.averageTicket).toBe(1000); // 25000 / 25 (completed + delivered)
      expect(result.ordersCreatedToday).toBe(5);
      expect(result.ordersCompletedToday).toBe(3);
    });

    it('should return null averageTicket when no completed orders', async () => {
      mockServiceOrderRepository.getOrderCountByStatus.mockResolvedValueOnce({
        ...mockOrdersByStatus,
        [ServiceOrderStatus.COMPLETED]: 0,
        [ServiceOrderStatus.DELIVERED]: 0,
      });
      mockServiceOrderRepository.getTotalRevenue.mockResolvedValueOnce(0);

      const result = await useCase.execute();

      expect(result.averageTicket).toBeNull();
      expect(result.totalRevenue).toBe(0);
    });

    it('should return null averageCompletionTime when no data available', async () => {
      mockServiceOrderRepository.getAverageCompletionTime.mockResolvedValueOnce(null);

      const result = await useCase.execute();

      expect(result.averageCompletionTimeMinutes).toBeNull();
    });

    it('should call all repository methods in parallel', async () => {
      await useCase.execute();

      expect(mockServiceOrderRepository.getOrderCountByStatus).toHaveBeenCalledTimes(1);
      expect(mockServiceOrderRepository.getAverageCompletionTime).toHaveBeenCalledTimes(1);
      expect(mockServiceOrderRepository.getTotalRevenue).toHaveBeenCalledTimes(1);
      expect(mockStatusHistoryRepository.getAverageTimeByStatus).toHaveBeenCalledTimes(1);
      expect(mockServiceOrderRepository.getOrdersCountByDateRange).toHaveBeenCalledTimes(1);
      expect(mockServiceOrderRepository.getCompletedOrdersCountByDateRange).toHaveBeenCalledTimes(1);
    });

    it('should use today date range for daily metrics', async () => {
      const beforeExecution = new Date();

      await useCase.execute();

      const callArgs = mockServiceOrderRepository.getOrdersCountByDateRange.mock.calls[0];
      const startDate = callArgs[0] as Date;
      const endDate = callArgs[1] as Date;

      // Check that start of day is correct (midnight)
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);

      // Check that end of day is correct (23:59:59)
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);

      // Check same day
      expect(startDate.getDate()).toBe(beforeExecution.getDate());
      expect(endDate.getDate()).toBe(beforeExecution.getDate());
    });

    it('should handle zero orders gracefully', async () => {
      const emptyOrdersByStatus: Record<string, number> = {};
      for (const status of Object.values(ServiceOrderStatus)) {
        emptyOrdersByStatus[status] = 0;
      }

      mockServiceOrderRepository.getOrderCountByStatus.mockResolvedValueOnce(emptyOrdersByStatus);
      mockServiceOrderRepository.getAverageCompletionTime.mockResolvedValueOnce(null);
      mockServiceOrderRepository.getTotalRevenue.mockResolvedValueOnce(0);
      mockServiceOrderRepository.getOrdersCountByDateRange.mockResolvedValueOnce(0);
      mockServiceOrderRepository.getCompletedOrdersCountByDateRange.mockResolvedValueOnce(0);

      const result = await useCase.execute();

      expect(result.totalOrders).toBe(0);
      expect(result.averageTicket).toBeNull();
      expect(result.totalRevenue).toBe(0);
      expect(result.ordersCreatedToday).toBe(0);
      expect(result.ordersCompletedToday).toBe(0);
    });

    it('should calculate correct average ticket with decimals', async () => {
      mockServiceOrderRepository.getOrderCountByStatus.mockResolvedValueOnce({
        ...mockOrdersByStatus,
        [ServiceOrderStatus.COMPLETED]: 3,
        [ServiceOrderStatus.DELIVERED]: 2,
      });
      mockServiceOrderRepository.getTotalRevenue.mockResolvedValueOnce(1000);

      const result = await useCase.execute();

      // 1000 / 5 = 200
      expect(result.averageTicket).toBe(200);
    });
  });
});
