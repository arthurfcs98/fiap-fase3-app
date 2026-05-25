import { Test, TestingModule } from '@nestjs/testing';
import { ListServiceOrdersUseCase } from '@/modules/service-order/application/use-cases/list-service-orders/list-service-orders.use-case';
import { ListServiceOrdersInput } from '@/modules/service-order/application/dto/input/query-service-order.input';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';

describe('ListServiceOrdersUseCase', () => {
  let useCase: ListServiceOrdersUseCase;

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

  const mockOrders = [
    {
      id: 'order-uuid-1',
      orderNumber: 'OS-2024-00001',
      status: ServiceOrderStatus.RECEIVED,
      customer: mockCustomer,
      vehicle: mockVehicle,
      serviceItems: [],
      partItems: [],
      totalAmount: 150,
      createdAt: new Date(),
      getExecutionTime: jest.fn().mockReturnValue(null),
    },
    {
      id: 'order-uuid-2',
      orderNumber: 'OS-2024-00002',
      status: ServiceOrderStatus.IN_PROGRESS,
      customer: mockCustomer,
      vehicle: mockVehicle,
      serviceItems: [],
      partItems: [],
      totalAmount: 200,
      createdAt: new Date(),
      getExecutionTime: jest.fn().mockReturnValue(30),
    },
  ];

  const mockServiceOrderRepository = {
    findAll: jest.fn().mockResolvedValue([mockOrders, 2]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListServiceOrdersUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListServiceOrdersUseCase>(ListServiceOrdersUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated list of service orders', async () => {
      const input = new ListServiceOrdersInput({ page: 1, limit: 10 });

      const result = await useCase.execute(input);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should pass filters to repository', async () => {
      const input = new ListServiceOrdersInput({
        page: 1,
        limit: 10,
        status: ServiceOrderStatus.IN_PROGRESS,
        customerId: 'customer-uuid',
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.findAll).toHaveBeenCalledWith(1, 10, {
        status: ServiceOrderStatus.IN_PROGRESS,
        customerId: 'customer-uuid',
      });
    });

    it('should use default pagination values', async () => {
      const input = new ListServiceOrdersInput({});

      await useCase.execute(input);

      expect(mockServiceOrderRepository.findAll).toHaveBeenCalledWith(
        1,
        10,
        expect.any(Object),
      );
    });

    it('should calculate correct total pages', async () => {
      mockServiceOrderRepository.findAll.mockResolvedValueOnce([
        mockOrders,
        25,
      ]);

      const input = new ListServiceOrdersInput({ page: 1, limit: 10 });

      const result = await useCase.execute(input);

      expect(result.totalPages).toBe(3);
    });
  });
});
