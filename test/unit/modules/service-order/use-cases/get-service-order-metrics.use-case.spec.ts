import { Test, TestingModule } from '@nestjs/testing';
import { GetServiceOrderMetricsUseCase } from '@/modules/service-order/application/use-cases/get-service-order-metrics/get-service-order-metrics.use-case';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { SERVICE_ORDER_STATUS_HISTORY_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order-status-history.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';

describe('GetServiceOrderMetricsUseCase', () => {
  let useCase: GetServiceOrderMetricsUseCase;

  const mockOrder = {
    id: 'order-uuid',
    orderNumber: 'OS-2024-00001',
    status: ServiceOrderStatus.COMPLETED,
    createdAt: new Date('2024-01-01T08:00:00Z'),
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: new Date('2024-01-01T12:00:00Z'),
    deliveredAt: null,
  };

  const mockServiceOrderRepository = {
    findById: jest.fn().mockResolvedValue(mockOrder),
  };

  const mockStatusHistoryRepository = {
    getTimeByStatusForOrder: jest.fn().mockResolvedValue({
      [ServiceOrderStatus.RECEIVED]: 30,
      [ServiceOrderStatus.IN_DIAGNOSIS]: 60,
      [ServiceOrderStatus.IN_PROGRESS]: 120,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetServiceOrderMetricsUseCase,
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

    useCase = module.get<GetServiceOrderMetricsUseCase>(
      GetServiceOrderMetricsUseCase,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return metrics for a specific service order', async () => {
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const result = await useCase.execute({ orderId: 'order-uuid' });

      expect(result.orderId).toBe('order-uuid');
      expect(result.orderNumber).toBe('OS-2024-00001');
      expect(result.status).toBe(ServiceOrderStatus.COMPLETED);
      expect(result.totalTimeMinutes).toBe(240); // 4 hours = 240 minutes
      expect(result.timeByStatus).toEqual({
        [ServiceOrderStatus.RECEIVED]: 30,
        [ServiceOrderStatus.IN_DIAGNOSIS]: 60,
        [ServiceOrderStatus.IN_PROGRESS]: 120,
      });
      expect(result.createdAt).toEqual(mockOrder.createdAt);
      expect(result.startedAt).toEqual(mockOrder.startedAt);
      expect(result.completedAt).toEqual(mockOrder.completedAt);
      expect(result.deliveredAt).toBeNull();
    });

    it('should return null totalTimeMinutes for incomplete order', async () => {
      const incompleteOrder = {
        ...mockOrder,
        status: ServiceOrderStatus.IN_PROGRESS,
        completedAt: null,
      };
      mockServiceOrderRepository.findById.mockResolvedValue(incompleteOrder);

      const result = await useCase.execute({ orderId: 'order-uuid' });

      expect(result.totalTimeMinutes).toBeNull();
    });

    it('should throw AppErrorException if order not found', async () => {
      mockServiceOrderRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ orderId: 'non-existent' }),
      ).rejects.toThrow(AppErrorException);
    });

    it('should call repository methods correctly', async () => {
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      await useCase.execute({ orderId: 'order-uuid' });

      expect(mockServiceOrderRepository.findById).toHaveBeenCalledWith(
        'order-uuid',
      );
      expect(
        mockStatusHistoryRepository.getTimeByStatusForOrder,
      ).toHaveBeenCalledWith('order-uuid');
    });
  });
});
