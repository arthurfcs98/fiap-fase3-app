import { Test, TestingModule } from '@nestjs/testing';
import { FindServiceOrderByOrderNumberUseCase } from '@/modules/service-order/application/use-cases/find-service-order-by-order-number/find-service-order-by-order-number.use-case';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { FindServiceOrderByOrderNumberInput } from '@/modules/service-order/application/dto/input/query-service-order.input';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';

describe('FindServiceOrderByOrderNumberUseCase', () => {
  let useCase: FindServiceOrderByOrderNumberUseCase;

  const mockVehicle = {
    id: 'vehicle-uuid',
    licensePlate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
  };

  const mockOrder = {
    id: 'order-uuid',
    orderNumber: 'OS-2024-00001',
    status: ServiceOrderStatus.IN_PROGRESS,
    vehicle: mockVehicle,
    serviceItems: [],
    partItems: [],
    totalAmount: 150,
    createdAt: new Date(),
    getExecutionTime: jest.fn().mockReturnValue(null),
  };

  const mockServiceOrderRepository = {
    findByOrderNumber: jest.fn().mockResolvedValue(mockOrder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindServiceOrderByOrderNumberUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindServiceOrderByOrderNumberUseCase>(
      FindServiceOrderByOrderNumberUseCase,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return public service order by order number', async () => {
      const input = new FindServiceOrderByOrderNumberInput('OS-2024-00001');

      const result = await useCase.execute(input);

      expect(result.orderNumber).toBe('OS-2024-00001');
      expect(result.vehiclePlate).toBe('ABC1234');
      expect(mockServiceOrderRepository.findByOrderNumber).toHaveBeenCalledWith(
        'OS-2024-00001',
      );
    });

    it('should throw AppErrorException if order not found', async () => {
      mockServiceOrderRepository.findByOrderNumber.mockResolvedValueOnce(null);

      const input = new FindServiceOrderByOrderNumberInput('non-existent');

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });
  });
});
