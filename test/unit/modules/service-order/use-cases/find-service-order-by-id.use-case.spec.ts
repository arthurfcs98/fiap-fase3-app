import { Test, TestingModule } from '@nestjs/testing';
import { FindServiceOrderByIdUseCase } from '@/modules/service-order/application/use-cases/find-service-order-by-id/find-service-order-by-id.use-case';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { FindServiceOrderByIdInput } from '@/modules/service-order/application/dto/input/query-service-order.input';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';

describe('FindServiceOrderByIdUseCase', () => {
  let useCase: FindServiceOrderByIdUseCase;

  const mockCustomer = {
    id: 'customer-uuid',
    name: 'John Doe',
    document: '12345678901',
    phone: '11999999999',
    email: 'john@example.com',
  };

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
    status: ServiceOrderStatus.RECEIVED,
    customer: mockCustomer,
    vehicle: mockVehicle,
    serviceItems: [],
    partItems: [],
    totalAmount: 150,
    createdAt: new Date(),
    getExecutionTime: jest.fn().mockReturnValue(null),
  };

  const mockServiceOrderRepository = {
    findById: jest.fn().mockResolvedValue(mockOrder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindServiceOrderByIdUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindServiceOrderByIdUseCase>(
      FindServiceOrderByIdUseCase,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return service order by id', async () => {
      const input = new FindServiceOrderByIdInput('order-uuid');

      const result = await useCase.execute(input);

      expect(result.id).toBe('order-uuid');
      expect(result.orderNumber).toBe('OS-2024-00001');
      expect(mockServiceOrderRepository.findById).toHaveBeenCalledWith(
        'order-uuid',
      );
    });

    it('should throw AppErrorException if order not found', async () => {
      mockServiceOrderRepository.findById.mockResolvedValueOnce(null);

      const input = new FindServiceOrderByIdInput('non-existent');

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });
  });
});
