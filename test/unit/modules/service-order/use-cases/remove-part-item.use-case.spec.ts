import { Test, TestingModule } from '@nestjs/testing';
import { RemovePartItemUseCase } from '@/modules/service-order/application/use-cases/remove-part-item/remove-part-item.use-case';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { RemovePartItemInput } from '@/modules/service-order/application/dto/input/remove-item.input';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { SERVICE_ORDER_PART_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order-part.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';
import { STOCK_SERVICE } from '@/modules/part/domain/services/stock.service.interface';

describe('RemovePartItemUseCase', () => {
  let useCase: RemovePartItemUseCase;

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

  const createMockOrder = (status: ServiceOrderStatus) => ({
    id: 'order-uuid',
    orderNumber: 'OS-2024-00001',
    status,
    customer: mockCustomer,
    vehicle: mockVehicle,
    serviceItems: [],
    partItems: [],
    totalAmount: 51,
    createdAt: new Date(),
    calculateTotal: jest.fn().mockReturnValue(0),
    getExecutionTime: jest.fn().mockReturnValue(null),
  });

  const mockServiceOrderRepository = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    recalculateTotal: jest.fn().mockResolvedValue(undefined),
  };

  const mockPartItemRepository = {
    findOne: jest.fn().mockResolvedValue({
      id: 'item-uuid',
      partId: 'part-uuid',
      quantity: 2,
      serviceOrderId: 'order-uuid',
    }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockStockService = {
    reserveStock: jest.fn().mockResolvedValue(undefined),
    releaseStock: jest.fn().mockResolvedValue(undefined),
    confirmStockDeduction: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemovePartItemUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
        {
          provide: SERVICE_ORDER_PART_REPOSITORY,
          useValue: mockPartItemRepository,
        },
        {
          provide: STOCK_SERVICE,
          useValue: mockStockService,
        },
      ],
    }).compile();

    useCase = module.get<RemovePartItemUseCase>(RemovePartItemUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should remove part item from order', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_DIAGNOSIS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new RemovePartItemInput({
        orderId: 'order-uuid',
        itemId: 'item-uuid',
      });

      await useCase.execute(input);

      expect(mockPartItemRepository.delete).toHaveBeenCalledWith({
        id: 'item-uuid',
        serviceOrderId: 'order-uuid',
      });
    });

    it('should throw AppErrorException if order not found', async () => {
      mockServiceOrderRepository.findById.mockResolvedValue(null);

      const input = new RemovePartItemInput({
        orderId: 'non-existent',
        itemId: 'item-uuid',
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if order is not in editable status', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.DELIVERED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new RemovePartItemInput({
        orderId: 'order-uuid',
        itemId: 'item-uuid',
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if item not found', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPartItemRepository.findOne.mockResolvedValueOnce(null);

      const input = new RemovePartItemInput({
        orderId: 'order-uuid',
        itemId: 'non-existent',
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should remove part item from order in RECEIVED status', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new RemovePartItemInput({
        orderId: 'order-uuid',
        itemId: 'item-uuid',
      });

      await useCase.execute(input);

      expect(mockPartItemRepository.delete).toHaveBeenCalledWith({
        id: 'item-uuid',
        serviceOrderId: 'order-uuid',
      });
    });

    it('should release stock when removing part item', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_DIAGNOSIS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new RemovePartItemInput({
        orderId: 'order-uuid',
        itemId: 'item-uuid',
      });

      await useCase.execute(input);

      expect(mockStockService.releaseStock).toHaveBeenCalledWith(
        'part-uuid',
        2,
        'order-uuid',
      );
    });

    it('should call recalculateTotal after removing part item', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_DIAGNOSIS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new RemovePartItemInput({
        orderId: 'order-uuid',
        itemId: 'item-uuid',
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.recalculateTotal).toHaveBeenCalledWith(
        'order-uuid',
      );
    });
  });
});
