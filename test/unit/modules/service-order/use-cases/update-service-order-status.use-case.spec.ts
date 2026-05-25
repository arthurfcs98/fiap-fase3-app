import { Test, TestingModule } from '@nestjs/testing';
import { UpdateServiceOrderStatusUseCase } from '@/modules/service-order/application/use-cases/update-service-order-status/update-service-order-status.use-case';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { UpdateServiceOrderStatusInput } from '@/modules/service-order/application/dto/input/update-service-order-status.input';
import { SERVICE_ORDER_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order.repository.interface';
import { SERVICE_ORDER_STATUS_HISTORY_REPOSITORY } from '@/modules/service-order/domain/repositories/service-order-status-history.repository.interface';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';
import { STOCK_SERVICE } from '@/modules/part/domain/services/stock.service.interface';
import { NOTIFICATION_SERVICE } from '@/modules/notification/domain/services/notification.service.interface';

describe('UpdateServiceOrderStatusUseCase', () => {
  let useCase: UpdateServiceOrderStatusUseCase;

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
    customerId: 'customer-uuid',
    vehicleId: 'vehicle-uuid',
    status,
    customer: mockCustomer,
    vehicle: mockVehicle,
    serviceItems: [],
    partItems: [],
    totalAmount: 150,
    observations: null,
    diagnosisNotes: null,
    createdAt: new Date(),
    startedAt: null,
    completedAt: null,
    deliveredAt: null,
    getExecutionTime: jest.fn().mockReturnValue(null),
  });

  const mockServiceOrderRepository = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const mockStatusHistoryRepository = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockStockService = {
    reserveStock: jest.fn().mockResolvedValue(undefined),
    releaseStock: jest.fn().mockResolvedValue(undefined),
    confirmStockDeduction: jest.fn().mockResolvedValue(undefined),
    releaseAllReservedStock: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotificationService = {
    notifyStatusChange: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateServiceOrderStatusUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
        {
          provide: SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
          useValue: mockStatusHistoryRepository,
        },
        {
          provide: STOCK_SERVICE,
          useValue: mockStockService,
        },
        {
          provide: NOTIFICATION_SERVICE,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    useCase = module.get<UpdateServiceOrderStatusUseCase>(
      UpdateServiceOrderStatusUseCase,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update status from RECEIVED to IN_DIAGNOSIS', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      const updatedMockOrder = createMockOrder(ServiceOrderStatus.IN_DIAGNOSIS);
      mockServiceOrderRepository.findById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedMockOrder);

      const input = new UpdateServiceOrderStatusInput({
        id: 'order-uuid',
        status: ServiceOrderStatus.IN_DIAGNOSIS,
      });

      const result = await useCase.execute(input);

      expect(result.status).toBe(ServiceOrderStatus.IN_DIAGNOSIS);
      expect(mockServiceOrderRepository.update).toHaveBeenCalledWith(
        'order-uuid',
        expect.objectContaining({ status: ServiceOrderStatus.IN_DIAGNOSIS }),
      );
    });

    it('should set startedAt when transitioning to IN_PROGRESS', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.AWAITING_START);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new UpdateServiceOrderStatusInput({
        id: 'order-uuid',
        status: ServiceOrderStatus.IN_PROGRESS,
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.update).toHaveBeenCalledWith(
        'order-uuid',
        expect.objectContaining({
          status: ServiceOrderStatus.IN_PROGRESS,
          startedAt: expect.any(Date),
        }),
      );
    });

    it('should set completedAt when transitioning to COMPLETED', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_PROGRESS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new UpdateServiceOrderStatusInput({
        id: 'order-uuid',
        status: ServiceOrderStatus.COMPLETED,
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.update).toHaveBeenCalledWith(
        'order-uuid',
        expect.objectContaining({
          status: ServiceOrderStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      );
    });

    it('should set deliveredAt when transitioning to DELIVERED', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.COMPLETED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new UpdateServiceOrderStatusInput({
        id: 'order-uuid',
        status: ServiceOrderStatus.DELIVERED,
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.update).toHaveBeenCalledWith(
        'order-uuid',
        expect.objectContaining({
          status: ServiceOrderStatus.DELIVERED,
          deliveredAt: expect.any(Date),
        }),
      );
    });

    it('should set diagnosisNotes when transitioning to AWAITING_APPROVAL with notes', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_DIAGNOSIS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new UpdateServiceOrderStatusInput({
        id: 'order-uuid',
        status: ServiceOrderStatus.AWAITING_APPROVAL,
        notes: 'Brake pads need replacement',
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.update).toHaveBeenCalledWith(
        'order-uuid',
        expect.objectContaining({
          status: ServiceOrderStatus.AWAITING_APPROVAL,
          diagnosisNotes: 'Brake pads need replacement',
        }),
      );
    });

    it('should append notes to observations for other statuses', async () => {
      const mockOrder = {
        ...createMockOrder(ServiceOrderStatus.IN_PROGRESS),
        observations: 'Initial observation',
      };
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new UpdateServiceOrderStatusInput({
        id: 'order-uuid',
        status: ServiceOrderStatus.COMPLETED,
        notes: 'Work completed successfully',
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.update).toHaveBeenCalledWith(
        'order-uuid',
        expect.objectContaining({
          observations: 'Initial observation\nWork completed successfully',
        }),
      );
    });

    it('should throw AppErrorException if order not found', async () => {
      mockServiceOrderRepository.findById.mockResolvedValue(null);

      const input = new UpdateServiceOrderStatusInput({
        id: 'non-existent',
        status: ServiceOrderStatus.IN_DIAGNOSIS,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException for invalid status transition', async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new UpdateServiceOrderStatusInput({
        id: 'order-uuid',
        status: ServiceOrderStatus.DELIVERED,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    describe('stock operations', () => {
      it('should call confirmStockDeduction when transitioning to COMPLETED', async () => {
        const mockOrder = createMockOrder(ServiceOrderStatus.IN_PROGRESS);
        mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

        const input = new UpdateServiceOrderStatusInput({
          id: 'order-uuid',
          status: ServiceOrderStatus.COMPLETED,
        });

        await useCase.execute(input);

        expect(mockStockService.confirmStockDeduction).toHaveBeenCalledWith('order-uuid');
        expect(mockStockService.confirmStockDeduction).toHaveBeenCalledTimes(1);
      });

      it('should call releaseAllReservedStock when transitioning to CANCELLED', async () => {
        const mockOrder = createMockOrder(ServiceOrderStatus.AWAITING_APPROVAL);
        mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

        const input = new UpdateServiceOrderStatusInput({
          id: 'order-uuid',
          status: ServiceOrderStatus.CANCELLED,
        });

        await useCase.execute(input);

        expect(mockStockService.releaseAllReservedStock).toHaveBeenCalledWith('order-uuid');
        expect(mockStockService.releaseAllReservedStock).toHaveBeenCalledTimes(1);
      });

      it('should not call stock operations when transitioning to IN_DIAGNOSIS', async () => {
        const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
        mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

        const input = new UpdateServiceOrderStatusInput({
          id: 'order-uuid',
          status: ServiceOrderStatus.IN_DIAGNOSIS,
        });

        await useCase.execute(input);

        expect(mockStockService.confirmStockDeduction).not.toHaveBeenCalled();
        expect(mockStockService.releaseAllReservedStock).not.toHaveBeenCalled();
      });

      it('should not call stock operations when transitioning to AWAITING_APPROVAL', async () => {
        const mockOrder = createMockOrder(ServiceOrderStatus.IN_DIAGNOSIS);
        mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

        const input = new UpdateServiceOrderStatusInput({
          id: 'order-uuid',
          status: ServiceOrderStatus.AWAITING_APPROVAL,
        });

        await useCase.execute(input);

        expect(mockStockService.confirmStockDeduction).not.toHaveBeenCalled();
        expect(mockStockService.releaseAllReservedStock).not.toHaveBeenCalled();
      });
    });

    describe('AWAITING_START transitions', () => {
      it('should allow transition from AWAITING_APPROVAL to AWAITING_START', async () => {
        const mockOrder = createMockOrder(ServiceOrderStatus.AWAITING_APPROVAL);
        const updatedOrder = createMockOrder(ServiceOrderStatus.AWAITING_START);
        mockServiceOrderRepository.findById
          .mockResolvedValueOnce(mockOrder)
          .mockResolvedValueOnce(updatedOrder);

        const input = new UpdateServiceOrderStatusInput({
          id: 'order-uuid',
          status: ServiceOrderStatus.AWAITING_START,
        });

        const result = await useCase.execute(input);

        expect(result.status).toBe(ServiceOrderStatus.AWAITING_START);
        expect(mockServiceOrderRepository.update).toHaveBeenCalledWith(
          'order-uuid',
          expect.objectContaining({ status: ServiceOrderStatus.AWAITING_START }),
        );
      });

      it('should allow transition from AWAITING_START to IN_PROGRESS and set startedAt', async () => {
        const mockOrder = createMockOrder(ServiceOrderStatus.AWAITING_START);
        const updatedOrder = createMockOrder(ServiceOrderStatus.IN_PROGRESS);
        mockServiceOrderRepository.findById
          .mockResolvedValueOnce(mockOrder)
          .mockResolvedValueOnce(updatedOrder);

        const input = new UpdateServiceOrderStatusInput({
          id: 'order-uuid',
          status: ServiceOrderStatus.IN_PROGRESS,
        });

        await useCase.execute(input);

        expect(mockServiceOrderRepository.update).toHaveBeenCalledWith(
          'order-uuid',
          expect.objectContaining({
            status: ServiceOrderStatus.IN_PROGRESS,
            startedAt: expect.any(Date),
          }),
        );
      });

      it('should allow transition from AWAITING_START to CANCELLED and release stock', async () => {
        const mockOrder = createMockOrder(ServiceOrderStatus.AWAITING_START);
        const updatedOrder = createMockOrder(ServiceOrderStatus.CANCELLED);
        mockServiceOrderRepository.findById
          .mockResolvedValueOnce(mockOrder)
          .mockResolvedValueOnce(updatedOrder);

        const input = new UpdateServiceOrderStatusInput({
          id: 'order-uuid',
          status: ServiceOrderStatus.CANCELLED,
        });

        await useCase.execute(input);

        expect(mockStockService.releaseAllReservedStock).toHaveBeenCalledWith('order-uuid');
      });
    });

    describe('status history', () => {
      it('should create status history record on transition', async () => {
        const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
        mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

        const input = new UpdateServiceOrderStatusInput({
          id: 'order-uuid',
          status: ServiceOrderStatus.IN_DIAGNOSIS,
          notes: 'Starting diagnosis',
        });

        await useCase.execute(input);

        expect(mockStatusHistoryRepository.create).toHaveBeenCalledWith({
          serviceOrderId: 'order-uuid',
          fromStatus: ServiceOrderStatus.RECEIVED,
          toStatus: ServiceOrderStatus.IN_DIAGNOSIS,
          changedAt: expect.any(Date),
          notes: 'Starting diagnosis',
        });
      });

      it('should create status history with null notes when no notes provided', async () => {
        const mockOrder = createMockOrder(ServiceOrderStatus.IN_PROGRESS);
        mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

        const input = new UpdateServiceOrderStatusInput({
          id: 'order-uuid',
          status: ServiceOrderStatus.COMPLETED,
        });

        await useCase.execute(input);

        expect(mockStatusHistoryRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            notes: null,
          }),
        );
      });
    });
  });
});
