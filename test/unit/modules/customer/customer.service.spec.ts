import { Test, TestingModule } from "@nestjs/testing";
import { CustomerService } from "@/modules/customer/application/services/customer.service";
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { CUSTOMER_REPOSITORY } from "@/modules/customer/domain/repositories/customer.repository.interface";

describe("CustomerService", () => {
  let service: CustomerService;

  const mockCustomer = {
    id: "test-uuid",
    document: "52998224725",
    documentType: "CPF",
    name: "John Doe",
    email: "john@example.com",
    phone: "11999999999",
    street: "Main Street",
    number: "123",
    city: "Sao Paulo",
    state: "SP",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomerRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByDocument: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a customer successfully", async () => {
      mockCustomerRepository.findByDocument.mockResolvedValue(null);
      mockCustomerRepository.create.mockResolvedValue(mockCustomer);

      const result = await service.create({
        document: "529.982.247-25",
        name: "John Doe",
        email: "john@example.com",
        phone: "11999999999",
      });

      expect(result).toHaveProperty("id");
      expect(result.document).toBe("52998224725");
      expect(result.documentType).toBe("CPF");
      expect(mockCustomerRepository.create).toHaveBeenCalled();
    });

    it("should throw AppErrorException if document already exists", async () => {
      mockCustomerRepository.findByDocument.mockResolvedValue(mockCustomer);

      await expect(
        service.create({
          document: "52998224725",
          name: "John Doe",
          email: "john@example.com",
          phone: "11999999999",
        }),
      ).rejects.toThrow(AppErrorException);
    });

    it("should create a customer with CNPJ", async () => {
      const cnpjCustomer = {
        ...mockCustomer,
        document: "11222333000181",
        documentType: "CNPJ",
      };
      mockCustomerRepository.findByDocument.mockResolvedValue(null);
      mockCustomerRepository.create.mockResolvedValue(cnpjCustomer);

      const result = await service.create({
        document: "11.222.333/0001-81",
        name: "Company Name",
        email: "company@example.com",
        phone: "11999999999",
      });

      expect(result.documentType).toBe("CNPJ");
    });
  });

  describe("findAll", () => {
    it("should return paginated customers", async () => {
      mockCustomerRepository.findAll.mockResolvedValue([[mockCustomer], 1]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it("should use default pagination values", async () => {
      mockCustomerRepository.findAll.mockResolvedValue([[mockCustomer], 1]);

      const result = await service.findAll();

      expect(mockCustomerRepository.findAll).toHaveBeenCalledWith(1, 10);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("findById", () => {
    it("should return a customer by id", async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);

      const result = await service.findById("test-uuid");

      expect(result.id).toBe("test-uuid");
    });

    it("should throw AppErrorException if customer not found", async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(service.findById("non-existent")).rejects.toThrow(
        AppErrorException,
      );
    });
  });

  describe("findByDocument", () => {
    it("should return a customer by document", async () => {
      mockCustomerRepository.findByDocument.mockResolvedValue(mockCustomer);

      const result = await service.findByDocument("52998224725");

      expect(result.document).toBe("52998224725");
    });

    it("should throw AppErrorException if customer not found", async () => {
      mockCustomerRepository.findByDocument.mockResolvedValue(null);

      await expect(service.findByDocument("11144477735")).rejects.toThrow(
        AppErrorException,
      );
    });
  });

  describe("update", () => {
    it("should update a customer successfully", async () => {
      const updatedCustomer = { ...mockCustomer, name: "Jane Doe" };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.update.mockResolvedValue(updatedCustomer);

      const result = await service.update("test-uuid", { name: "Jane Doe" });

      expect(result.name).toBe("Jane Doe");
    });

    it("should throw AppErrorException if customer not found", async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(
        service.update("non-existent", { name: "Jane Doe" }),
      ).rejects.toThrow(AppErrorException);
    });

    it("should update document successfully when no conflict", async () => {
      const updatedCustomer = {
        ...mockCustomer,
        document: "11144477735",
        documentType: "CPF",
      };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.findByDocument.mockResolvedValue(null);
      mockCustomerRepository.update.mockResolvedValue(updatedCustomer);

      const result = await service.update("test-uuid", {
        document: "111.444.777-35",
      });

      expect(result.document).toBe("11144477735");
    });

    it("should allow updating to same document (own customer)", async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.findByDocument.mockResolvedValue(mockCustomer);
      mockCustomerRepository.update.mockResolvedValue(mockCustomer);

      const result = await service.update("test-uuid", {
        document: "52998224725",
      });

      expect(result.document).toBe("52998224725");
    });

    it("should throw AppErrorException if new document already exists", async () => {
      const anotherCustomer = { ...mockCustomer, id: "another-uuid" };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.findByDocument.mockResolvedValue(anotherCustomer);

      await expect(
        service.update("test-uuid", { document: "11144477735" }),
      ).rejects.toThrow(AppErrorException);
    });

    it("should throw AppErrorException if update returns null", async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.update.mockResolvedValue(null);

      await expect(
        service.update("test-uuid", { name: "Jane Doe" }),
      ).rejects.toThrow(AppErrorException);
    });
  });

  describe("delete", () => {
    it("should delete a customer successfully", async () => {
      mockCustomerRepository.delete.mockResolvedValue(true);

      await expect(service.delete("test-uuid")).resolves.not.toThrow();
      expect(mockCustomerRepository.delete).toHaveBeenCalledWith("test-uuid");
    });
  });
});
