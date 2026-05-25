import { Test, TestingModule } from '@nestjs/testing';
import { RejectQuoteUseCase } from '@/modules/service-order/application/use-cases/reject-quote/reject-quote.use-case';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { FindServiceOrderByOrderNumberInput } from '@/modules/service-order/application/dto/input/query-service-order.input';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { SERVICE_ORDER_STATUS_HISTORY_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order-status-history.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';
import { NOTIFICATION_SERVICE } from '@/modules/notification/domain/services/notification.service.interface';

describe('RejectQuoteUseCase', () => {
  let useCase: RejectQuoteUseCase;

  const mockVehicle = {
    id: 'vehicle-uuid',
    licensePlate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
  };

  const createMockOrder = (status: ServiceOrderStatus) => ({
    id: 'order-uuid',
    orderNumber: 'OS-2024-00001',
    customerId: 'customer-uuid',
    status,
    customer: { id: 'customer-uuid', name: 'John Doe', email: 'john@test.com', document: '12345678901', phone: '11999999999' },
    vehicle: mockVehicle,
    serviceItems: [],
    partItems: [],
    totalAmount: 150,
    createdAt: new Date(),
    getExecutionTime: jest.fn().mockReturnValue(null),
  });

  const mockServiceOrderRepository = {
    findByOrderNumber: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const mockStatusHistoryRepository = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockNotificationService = {
    notifyStatusChange: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RejectQuoteUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
        {
          provide: SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
          useValue: mockStatusHistoryRepository,
        },
        {
          provide: NOTIFICATION_SERVICE,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    useCase = module.get<RejectQuoteUseCase>(RejectQuoteUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should reject quote and transition to CANCELLED', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.AWAITING_APPROVAL);
      mockServiceOrderRepository.findByOrderNumber.mockResolvedValue(mockOrder);

      const input = new FindServiceOrderByOrderNumberInput('OS-2024-00001');

      const result = await useCase.execute(input);

      expect(mockServiceOrderRepository.update).toHaveBeenCalledWith(
        'order-uuid',
        { status: ServiceOrderStatus.CANCELLED },
      );
      expect(result.orderNumber).toBe('OS-2024-00001');
    });

    it('should throw AppErrorException if order not found', async () => {
      mockServiceOrderRepository.findByOrderNumber.mockResolvedValue(null);

      const input = new FindServiceOrderByOrderNumberInput('non-existent');

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if order is not awaiting approval', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_PROGRESS);
      mockServiceOrderRepository.findByOrderNumber.mockResolvedValue(mockOrder);

      const input = new FindServiceOrderByOrderNumberInput('OS-2024-00001');

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });
  });
});
