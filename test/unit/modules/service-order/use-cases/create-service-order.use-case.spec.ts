import { Test, TestingModule } from "@nestjs/testing";
import { CreateServiceOrderUseCase } from "@/modules/service-order/application/use-cases/create-service-order/create-service-order.use-case";
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { CreateServiceOrderInput } from "@/modules/service-order/application/dto/input/create-service-order.input";
import { SERVICE_ORDER_REPOSITORY } from "@/modules/service-order/domain/repositories/service-order.repository.interface";
import { SERVICE_ORDER_STATUS_HISTORY_REPOSITORY } from "@/modules/service-order/domain/repositories/service-order-status-history.repository.interface";
import { CUSTOMER_REPOSITORY } from "@/modules/customer/domain/repositories/customer.repository.interface";
import { VEHICLE_REPOSITORY } from "@/modules/vehicle/domain/repositories/vehicle.repository.interface";
import { SERVICE_REPOSITORY } from "@/modules/service/domain/repositories/service.repository.interface";
import { PART_REPOSITORY } from "@/modules/part/domain/repositories/part.repository.interface";
import { SERVICE_ORDER_ITEM_REPOSITORY } from "@/modules/service-order/domain/repositories/service-order-item.repository.interface";
import { SERVICE_ORDER_PART_REPOSITORY } from "@/modules/service-order/domain/repositories/service-order-part.repository.interface";
import { ServiceOrderStatus } from "@/modules/service-order/domain/enums/service-order-status.enum";

describe("CreateServiceOrderUseCase", () => {
  let useCase: CreateServiceOrderUseCase;

  const mockCustomer = {
    id: "customer-uuid",
    name: "John Doe",
    document: "12345678901",
    phone: "11999999999",
    email: "john@example.com",
  };

  const mockVehicle = {
    id: "vehicle-uuid",
    customerId: "customer-uuid",
    licensePlate: "ABC1234",
    brand: "Toyota",
    model: "Corolla",
    year: 2023,
  };

  const mockService = {
    id: "service-uuid",
    code: "SRV001",
    name: "Oil Change",
    basePrice: 150,
  };

  const mockPart = {
    id: "part-uuid",
    code: "PRT001",
    name: "Oil Filter",
    unitPrice: 25.5,
    stockQuantity: 100,
    hasStock: jest.fn().mockReturnValue(true),
  };

  const mockServiceOrder = {
    id: "order-uuid",
    orderNumber: "OS-2024-00001",
    customerId: "customer-uuid",
    vehicleId: "vehicle-uuid",
    status: ServiceOrderStatus.RECEIVED,
    customer: mockCustomer,
    vehicle: mockVehicle,
    serviceItems: [],
    partItems: [],
    totalAmount: 0,
    createdAt: new Date(),
    calculateTotal: jest.fn().mockReturnValue(175.5),
    getExecutionTime: jest.fn().mockReturnValue(null),
  };

  const mockServiceOrderRepository = {
    create: jest.fn().mockResolvedValue(mockServiceOrder),
    findById: jest.fn().mockResolvedValue(mockServiceOrder),
    update: jest.fn().mockResolvedValue(mockServiceOrder),
    getNextOrderNumber: jest.fn().mockResolvedValue("OS-2024-00001"),
    recalculateTotal: jest.fn().mockResolvedValue(undefined),
  };

  const mockCustomerRepository = {
    findById: jest.fn().mockResolvedValue(mockCustomer),
  };

  const mockVehicleRepository = {
    findById: jest.fn().mockResolvedValue(mockVehicle),
  };

  const mockServiceRepository = {
    findById: jest.fn().mockResolvedValue(mockService),
  };

  const mockPartRepository = {
    findById: jest.fn().mockResolvedValue(mockPart),
  };

  const mockServiceItemRepository = {
    create: jest.fn().mockImplementation((data) => data),
    save: jest.fn().mockResolvedValue({}),
  };

  const mockPartItemRepository = {
    create: jest.fn().mockImplementation((data) => data),
    save: jest.fn().mockResolvedValue({}),
  };

  const mockStatusHistoryRepository = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateServiceOrderUseCase,
        {
          provide: SERVICE_ORDER_REPOSITORY,
          useValue: mockServiceOrderRepository,
        },
        {
          provide: SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
          useValue: mockStatusHistoryRepository,
        },
        { provide: CUSTOMER_REPOSITORY, useValue: mockCustomerRepository },
        { provide: VEHICLE_REPOSITORY, useValue: mockVehicleRepository },
        { provide: SERVICE_REPOSITORY, useValue: mockServiceRepository },
        { provide: PART_REPOSITORY, useValue: mockPartRepository },
        {
          provide: SERVICE_ORDER_ITEM_REPOSITORY,
          useValue: mockServiceItemRepository,
        },
        {
          provide: SERVICE_ORDER_PART_REPOSITORY,
          useValue: mockPartItemRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateServiceOrderUseCase>(CreateServiceOrderUseCase);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  describe("execute", () => {
    it("should create a service order successfully", async () => {
      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "vehicle-uuid",
        observations: "Test observation",
      });

      const result = await useCase.execute(input);

      expect(result.orderNumber).toBe("OS-2024-00001");
      expect(result.status).toBe(ServiceOrderStatus.RECEIVED);
      expect(mockServiceOrderRepository.create).toHaveBeenCalled();
      expect(mockServiceOrderRepository.getNextOrderNumber).toHaveBeenCalled();
    });

    it("should throw AppErrorException if customer not found", async () => {
      mockCustomerRepository.findById.mockResolvedValueOnce(null);

      const input = new CreateServiceOrderInput({
        customerId: "non-existent",
        vehicleId: "vehicle-uuid",
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should throw AppErrorException if vehicle not found", async () => {
      mockVehicleRepository.findById.mockResolvedValueOnce(null);

      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "non-existent",
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should throw AppErrorException if vehicle does not belong to customer", async () => {
      mockVehicleRepository.findById.mockResolvedValueOnce({
        ...mockVehicle,
        customerId: "different-customer",
      });

      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "vehicle-uuid",
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should add services when provided", async () => {
      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "vehicle-uuid",
        services: [{ serviceId: "service-uuid", quantity: 1 }],
      });

      await useCase.execute(input);

      expect(mockServiceRepository.findById).toHaveBeenCalledWith(
        "service-uuid",
      );
      expect(mockServiceItemRepository.save).toHaveBeenCalled();
    });

    it("should add parts when provided", async () => {
      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "vehicle-uuid",
        parts: [{ partId: "part-uuid", quantity: 2 }],
      });

      await useCase.execute(input);

      expect(mockPartRepository.findById).toHaveBeenCalledWith("part-uuid");
      expect(mockPartItemRepository.save).toHaveBeenCalled();
    });

    it("should throw AppErrorException if service not found when adding items", async () => {
      mockServiceRepository.findById.mockResolvedValueOnce(null);

      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "vehicle-uuid",
        services: [{ serviceId: "non-existent", quantity: 1 }],
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should throw AppErrorException for insufficient part stock", async () => {
      mockPart.hasStock.mockReturnValueOnce(false);

      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "vehicle-uuid",
        parts: [{ partId: "part-uuid", quantity: 200 }],
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should recalculate total after adding items", async () => {
      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "vehicle-uuid",
        services: [{ serviceId: "service-uuid", quantity: 1 }],
      });

      await useCase.execute(input);

      expect(mockServiceOrderRepository.recalculateTotal).toHaveBeenCalledWith(
        "order-uuid",
      );
    });

    it("should throw AppErrorException if part not found when adding parts", async () => {
      mockPartRepository.findById.mockResolvedValueOnce(null);

      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "vehicle-uuid",
        parts: [{ partId: "non-existent", quantity: 1 }],
      });

      await expect(useCase.execute(input)).rejects.toThrow(AppErrorException);
    });

    it("should create order with status history", async () => {
      const input = new CreateServiceOrderInput({
        customerId: "customer-uuid",
        vehicleId: "vehicle-uuid",
      });

      await useCase.execute(input);

      expect(mockStatusHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceOrderId: "order-uuid",
          fromStatus: null,
          toStatus: ServiceOrderStatus.RECEIVED,
          notes: "Ordem de serviço criada",
        }),
      );
    });
  });
});
