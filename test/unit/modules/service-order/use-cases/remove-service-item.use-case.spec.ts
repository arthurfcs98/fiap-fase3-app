import { Test, TestingModule } from '@nestjs/testing';
import { RemoveServiceItemUseCase } from '@/modules/service-order/application/use-cases/remove-service-item/remove-service-item.use-case';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { RemoveServiceItemInput } from '@/modules/service-order/application/dto/input/remove-item.input';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { SERVICE_ORDER_ITEM_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order-item.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';

describe('RemoveServiceItemUseCase', () => {
  let useCase: RemoveServiceItemUseCase;

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
    totalAmount: 150,
    createdAt: new Date(),
    calculateTotal: jest.fn().mockReturnValue(0),
    getExecutionTime: jest.fn().mockReturnValue(null),
  });

  const mockServiceOrderRepository = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    recalculateTotal: jest.fn().mockResolvedValue(undefined),
  };

  const mockServiceItemRepository = {
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveServiceItemUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
        {
          provide: SERVICE_ORDER_ITEM_REPOSITORY,
          useValue: mockServiceItemRepository,
        },
      ],
    }).compile();

    useCase = module.get<RemoveServiceItemUseCase>(RemoveServiceItemUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should remove service item from order', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new RemoveServiceItemInput({
        orderId: 'order-uuid',
        itemId: 'item-uuid',
      });

      await useCase.execute(input);

      expect(mockServiceItemRepository.delete).toHaveBeenCalledWith({
        id: 'item-uuid',
        serviceOrderId: 'order-uuid',
      });
    });

    it('should throw AppErrorException if order not found', async () => {
      mockServiceOrderRepository.findById.mockResolvedValue(null);

      const input = new RemoveServiceItemInput({
        orderId: 'non-existent',
        itemId: 'item-uuid',
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if order is not in editable status', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_PROGRESS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new RemoveServiceItemInput({
        orderId: 'order-uuid',
        itemId: 'item-uuid',
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if item not found', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);
      mockServiceItemRepository.delete.mockResolvedValueOnce({ affected: 0 });

      const input = new RemoveServiceItemInput({
        orderId: 'order-uuid',
        itemId: 'non-existent',
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should remove service item from order in IN_DIAGNOSIS status', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_DIAGNOSIS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new RemoveServiceItemInput({
        orderId: 'order-uuid',
        itemId: 'item-uuid',
      });

      await useCase.execute(input);

      expect(mockServiceItemRepository.delete).toHaveBeenCalledWith({
        id: 'item-uuid',
        serviceOrderId: 'order-uuid',
      });
    });

    it('should call recalculateTotal after removing service item', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new RemoveServiceItemInput({
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
