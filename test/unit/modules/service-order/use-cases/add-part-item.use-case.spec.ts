import { Test, TestingModule } from "@nestjs/testing";
import { AddPartItemUseCase } from "@/modules/service-order/application/use-cases/add-part-item/add-part-item.use-case";
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { AddPartItemInput } from "@/modules/service-order/application/dto/input/add-part-item.input";
import { SERVICE_ORDER_REPOSITORY } from "@/modules/service-order/domain/repositories/service-order.repository.interface";
import { PART_REPOSITORY } from "@/modules/part/domain/repositories/part.repository.interface";
import { SERVICE_ORDER_PART_REPOSITORY } from "@/modules/service-order/domain/repositories/service-order-part.repository.interface";
import { ServiceOrderStatus } from "@/modules/service-order/domain/enums/service-order-status.enum";
import { STOCK_SERVICE } from "@/modules/part/domain/services/stock.service.interface";

describe("AddPartItemUseCase", () => {
  let useCase: AddPartItemUseCase;

  const mockCustomer = {
    id: "customer-uuid",
    name: "John Doe",
    document: "12345678901",
    phone: "11999999999",
    email: "john@example.com",
  };

  const mockVehicle = {
    id: "vehicle-uuid",
    licensePlate: "ABC1234",
    brand: "Toyota",
    model: "Corolla",
    year: 2023,
  };

  const mockPart = {
    id: "part-uuid",
    code: "PRT001",
    name: "Oil Filter",
    unitPrice: 25.5,
    stockQuantity: 100,
    hasStock: jest.fn().mockReturnValue(true),
    hasAvailableStock: jest.fn().mockReturnValue(true),
  };

  const createMockOrder = (status: ServiceOrderStatus) => ({
    id: "order-uuid",
    orderNumber: "OS-2024-00001",
    status,
    customer: mockCustomer,
    vehicle: mockVehicle,
    serviceItems: [],
    partItems: [],
    totalAmount: 0,
    createdAt: new Date(),
    calculateTotal: jest.fn().mockReturnValue(51),
    getExecutionTime: jest.fn().mockReturnValue(null),
  });

  const mockServiceOrderRepository = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    recalculateTotal: jest.fn().mockResolvedValue(undefined),
  };

  const mockPartRepository = {
    findById: jest.fn().mockResolvedValue(mockPart),
  };

  const mockPartItemRepository = {
    create: jest.fn().mockImplementation((data) => data),
    save: jest.fn().mockResolvedValue({}),
  };

  const mockStockService = {
    reserveStock: jest.fn().mockResolvedValue(undefined),
    releaseStock: jest.fn().mockResolvedValue(undefined),
    confirmStockDeduction: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddPartItemUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
        { provide: PART_REPOSITORY, useValue: mockPartRepository },
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

    useCase = module.get<AddPartItemUseCase>(AddPartItemUseCase);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  describe("execute", () => {
    it("should add part item to order in RECEIVED status", async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddPartItemInput({
        orderId: "order-uuid",
        partId: "part-uuid",
        quantity: 2,
      });

      await useCase.execute(input);

      expect(mockPartItemRepository.save).toHaveBeenCalled();
      expect(mockPartItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 2,
          subtotal: 51,
        }),
      );
    });

    it("should throw AppErrorException if order not found", async () => {
      mockServiceOrderRepository.findById.mockResolvedValue(null);

      const input = new AddPartItemInput({
        orderId: "non-existent",
        partId: "part-uuid",
        quantity: 1,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should throw AppErrorException if order is not in editable status", async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.COMPLETED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddPartItemInput({
        orderId: "order-uuid",
        partId: "part-uuid",
        quantity: 1,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should throw AppErrorException if part not found", async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPartRepository.findById.mockResolvedValueOnce(null);

      const input = new AddPartItemInput({
        orderId: "order-uuid",
        partId: "non-existent",
        quantity: 1,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should throw AppErrorException for insufficient stock", async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPart.hasAvailableStock.mockReturnValueOnce(false);

      const input = new AddPartItemInput({
        orderId: "order-uuid",
        partId: "part-uuid",
        quantity: 200,
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should add part item to order in IN_DIAGNOSIS status", async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.IN_DIAGNOSIS);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddPartItemInput({
        orderId: "order-uuid",
        partId: "part-uuid",
        quantity: 1,
      });

      await useCase.execute(input);

      expect(mockPartItemRepository.save).toHaveBeenCalled();
    });

    it("should reserve stock when adding part", async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddPartItemInput({
        orderId: "order-uuid",
        partId: "part-uuid",
        quantity: 5,
      });

      await useCase.execute(input);

      expect(mockStockService.reserveStock).toHaveBeenCalledWith(
        "part-uuid",
        5,
        "order-uuid",
      );
    });

    it("should call recalculateTotal after adding part", async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddPartItemInput({
        orderId: "order-uuid",
        partId: "part-uuid",
        quantity: 1,
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.recalculateTotal).toHaveBeenCalledWith(
        "order-uuid",
      );
    });

    it("should recalculate total after adding part", async () => {
      const mockOrder = createMockOrder(ServiceOrderStatus.RECEIVED);
      mockServiceOrderRepository.findById.mockResolvedValue(mockOrder);

      const input = new AddPartItemInput({
        orderId: "order-uuid",
        partId: "part-uuid",
        quantity: 2,
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.recalculateTotal).toHaveBeenCalledWith(
        "order-uuid",
      );
    });
  });
});
