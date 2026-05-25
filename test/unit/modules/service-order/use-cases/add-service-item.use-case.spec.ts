import { Test, TestingModule } from '@nestjs/testing';
import { AddServiceItemUseCase } from '@/modules/service-order/application/use-cases/add-service-item/add-service-item.use-case';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { AddServiceItemInput } from '@/modules/service-order/application/dto/input/add-service-item.input';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { SERVICE_REPOSITORY } from '@/modules/service/domain/repositories/service.repository.interface';
import { SERVICE_ORDER_ITEM_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order-item.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';

describe('AddServiceItemUseCase', () => {
  let useCase: AddServiceItemUseCase;

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

  const mockService = {
    id: 'service-uuid',
    code: 'SRV001',
    name: 'Oil Change',
    basePrice: 150,
  };

  const createMockOrder = (status: ServiceOrderStatus) => ({
    id: 'order-uuid',
    orderNumber: 'OS-2024-00001',
    status,
    customer: mockCustomer,
    vehicle: mockVehicle,
    serviceItems: [],
    partItems: [],
    totalAmount: 0,
    createdAt: new Date(),
    calculateTotal: jest.fn().mockReturnValue(150),
    getExecutionTime: jest.fn().mockReturnValue(null),
  });

  const mockServiceOrderRepository = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    recalculateTotal: jest.fn().mockResolvedValue(undefined),
  };

  const mockServiceRepository = {
    findById: jest.fn().mockResolvedValue(mockService),
  };

  const mockServiceItemRepository = {
    create: jest.fn().mockImplementation((data) => data),
    save: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddServiceItemUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
        { provide: SERVICE_REPOSITORY, useValue: mockServiceRepository },
        {
          provide: SERVICE_ORDER_ITEM_REPOSITORY,
          useValue: mockServiceItemRepository,
        },
      ],
    }).compile();

    useCase = module.get<AddServiceItemUseCase>(AddServiceItemUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should add service item to order in RECEIVED status', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddServiceItemInput({
        orderId: 'order-uuid',
        serviceId: 'service-uuid',
        quantity: 1,
      });

      await useCase.execute(input);

      expect(mockServiceItemRepository.save).toHaveBeenCalled();
      expect(mockServiceOrderRepository.recalculateTotal).toHaveBeenCalledWith(
        'order-uuid',
      );
    });

    it('should add service item to order in IN_DIAGNOSIS status', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_DIAGNOSIS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddServiceItemInput({
        orderId: 'order-uuid',
        serviceId: 'service-uuid',
        quantity: 2,
      });

      await useCase.execute(input);

      expect(mockServiceItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 2,
          subtotal: 300,
        }),
      );
    });

    it('should throw AppErrorException if order not found', async () => {
      mockServiceOrderRepository.findById.mockResolvedValue(null);

      const input = new AddServiceItemInput({
        orderId: 'non-existent',
        serviceId: 'service-uuid',
        quantity: 1,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if order is not in editable status', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_PROGRESS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddServiceItemInput({
        orderId: 'order-uuid',
        serviceId: 'service-uuid',
        quantity: 1,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if service not found', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);
      mockServiceRepository.findById.mockResolvedValueOnce(null);

      const input = new AddServiceItemInput({
        orderId: 'order-uuid',
        serviceId: 'non-existent',
        quantity: 1,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should call recalculateTotal after adding service item', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddServiceItemInput({
        orderId: 'order-uuid',
        serviceId: 'service-uuid',
        quantity: 1,
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.recalculateTotal).toHaveBeenCalledWith(
        'order-uuid',
      );
    });

    it('should throw AppErrorException for AWAITING_APPROVAL status', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.AWAITING_APPROVAL);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddServiceItemInput({
        orderId: 'order-uuid',
        serviceId: 'service-uuid',
        quantity: 1,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });
  });
});
