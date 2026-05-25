import { Test, TestingModule } from '@nestjs/testing';
import { PartService } from '@/modules/part/application/services/part.service';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { PART_REPOSITORY } from '@/modules/part/domain/repositories/part.repository.interface';
import { StockOperationType } from '@/modules/part/application/dto';

describe('PartService', () => {
  let service: PartService;

  const mockPart = {
    id: 'test-uuid',
    code: 'PRT001',
    name: 'Oil Filter',
    description: 'High quality oil filter',
    unitPrice: 25.5,
    stockQuantity: 100,
    minimumStock: 10,
    manufacturer: 'Bosch',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    isLowStock: jest.fn().mockReturnValue(false),
    hasStock: jest.fn().mockReturnValue(true),
  };

  const mockPartRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findLowStock: jest.fn(),
    update: jest.fn(),
    updateStock: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartService,
        {
          provide: PART_REPOSITORY,
          useValue: mockPartRepository,
        },
      ],
    }).compile();

    service = module.get<PartService>(PartService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a part successfully', async () => {
      mockPartRepository.findByCode.mockResolvedValue(null);
      mockPartRepository.create.mockResolvedValue(mockPart);

      const result = await service.create({
        code: 'prt001',
        name: 'Oil Filter',
        unitPrice: 25.5,
        stockQuantity: 100,
        minimumStock: 10,
      });

      expect(result).toHaveProperty('id');
      expect(result.code).toBe('PRT001');
      expect(mockPartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'PRT001' }),
      );
    });

    it('should throw AppErrorException if code already exists', async () => {
      mockPartRepository.findByCode.mockResolvedValue(mockPart);

      await expect(
        service.create({
          code: 'PRT001',
          name: 'Oil Filter',
          unitPrice: 25.5,
        }),
      ).rejects.toThrow(AppErrorException);
    });

    it('should default stockQuantity to 0 when not provided', async () => {
      const partWithDefaults = { ...mockPart, stockQuantity: 0 };
      partWithDefaults.isLowStock = jest.fn().mockReturnValue(true);
      mockPartRepository.findByCode.mockResolvedValue(null);
      mockPartRepository.create.mockResolvedValue(partWithDefaults);

      await service.create({
        code: 'PRT002',
        name: 'New Part',
        unitPrice: 10.0,
      });

      expect(mockPartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ stockQuantity: 0 }),
      );
    });

    it('should default minimumStock to 0 when not provided', async () => {
      const partWithDefaults = { ...mockPart, minimumStock: 0 };
      partWithDefaults.isLowStock = jest.fn().mockReturnValue(false);
      mockPartRepository.findByCode.mockResolvedValue(null);
      mockPartRepository.create.mockResolvedValue(partWithDefaults);

      await service.create({
        code: 'PRT003',
        name: 'Another Part',
        unitPrice: 15.0,
        stockQuantity: 50,
      });

      expect(mockPartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ minimumStock: 0 }),
      );
    });

    it('should default both stockQuantity and minimumStock to 0 when not provided', async () => {
      const partWithDefaults = { ...mockPart, stockQuantity: 0, minimumStock: 0 };
      partWithDefaults.isLowStock = jest.fn().mockReturnValue(false);
      mockPartRepository.findByCode.mockResolvedValue(null);
      mockPartRepository.create.mockResolvedValue(partWithDefaults);

      await service.create({
        code: 'PRT004',
        name: 'Minimal Part',
        unitPrice: 5.0,
      });

      expect(mockPartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stockQuantity: 0,
          minimumStock: 0,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated parts', async () => {
      mockPartRepository.findAll.mockResolvedValue([[mockPart], 1]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should use default pagination values', async () => {
      mockPartRepository.findAll.mockResolvedValue([[mockPart], 1]);

      const result = await service.findAll();

      expect(mockPartRepository.findAll).toHaveBeenCalledWith(1, 10);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return a part by id', async () => {
      mockPartRepository.findById.mockResolvedValue(mockPart);

      const result = await service.findById('test-uuid');

      expect(result.id).toBe('test-uuid');
      expect(result.code).toBe('PRT001');
    });

    it('should throw AppErrorException if part not found', async () => {
      mockPartRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        AppErrorException,
      );
    });
  });

  describe('findByCode', () => {
    it('should return a part by code', async () => {
      mockPartRepository.findByCode.mockResolvedValue(mockPart);

      const result = await service.findByCode('PRT001');

      expect(result.code).toBe('PRT001');
    });

    it('should throw AppErrorException if part not found', async () => {
      mockPartRepository.findByCode.mockResolvedValue(null);

      await expect(service.findByCode('NON-EXISTENT')).rejects.toThrow(
        AppErrorException,
      );
    });
  });

  describe('findLowStock', () => {
    it('should return parts with low stock', async () => {
      const lowStockPart = { ...mockPart, stockQuantity: 5 };
      lowStockPart.isLowStock = jest.fn().mockReturnValue(true);
      mockPartRepository.findLowStock.mockResolvedValue([lowStockPart]);

      const result = await service.findLowStock();

      expect(result).toHaveLength(1);
      expect(result[0].isLowStock).toBe(true);
    });
  });

  describe('updateStock', () => {
    it('should add stock successfully', async () => {
      const updatedPart = { ...mockPart, stockQuantity: 110 };
      updatedPart.isLowStock = jest.fn().mockReturnValue(false);
      mockPartRepository.findById.mockResolvedValue(mockPart);
      mockPartRepository.updateStock.mockResolvedValue(updatedPart);

      await service.updateStock('test-uuid', {
        quantity: 10,
        operation: StockOperationType.ADD,
      });

      expect(mockPartRepository.updateStock).toHaveBeenCalledWith(
        'test-uuid',
        110,
      );
    });

    it('should remove stock successfully', async () => {
      const updatedPart = { ...mockPart, stockQuantity: 90 };
      updatedPart.isLowStock = jest.fn().mockReturnValue(false);
      mockPartRepository.findById.mockResolvedValue(mockPart);
      mockPartRepository.updateStock.mockResolvedValue(updatedPart);

      await service.updateStock('test-uuid', {
        quantity: 10,
        operation: StockOperationType.REMOVE,
      });

      expect(mockPartRepository.updateStock).toHaveBeenCalledWith(
        'test-uuid',
        90,
      );
    });

    it('should set stock to absolute value', async () => {
      const updatedPart = { ...mockPart, stockQuantity: 50 };
      updatedPart.isLowStock = jest.fn().mockReturnValue(false);
      mockPartRepository.findById.mockResolvedValue(mockPart);
      mockPartRepository.updateStock.mockResolvedValue(updatedPart);

      await service.updateStock('test-uuid', {
        quantity: 50,
        operation: StockOperationType.SET,
      });

      expect(mockPartRepository.updateStock).toHaveBeenCalledWith(
        'test-uuid',
        50,
      );
    });

    it('should throw AppErrorException for insufficient stock', async () => {
      mockPartRepository.findById.mockResolvedValue(mockPart);

      await expect(
        service.updateStock('test-uuid', {
          quantity: 200,
          operation: StockOperationType.REMOVE,
        }),
      ).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException for negative SET value', async () => {
      mockPartRepository.findById.mockResolvedValue(mockPart);

      await expect(
        service.updateStock('test-uuid', {
          quantity: -10,
          operation: StockOperationType.SET,
        }),
      ).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if part not found', async () => {
      mockPartRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateStock('non-existent', {
          quantity: 10,
          operation: StockOperationType.ADD,
        }),
      ).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if updateStock returns null', async () => {
      mockPartRepository.findById.mockResolvedValue(mockPart);
      mockPartRepository.updateStock.mockResolvedValue(null);

      await expect(
        service.updateStock('test-uuid', {
          quantity: 10,
          operation: StockOperationType.ADD,
        }),
      ).rejects.toThrow(AppErrorException);
    });
  });

  describe('update', () => {
    it('should update a part successfully', async () => {
      const updatedPart = { ...mockPart, name: 'Premium Oil Filter' };
      updatedPart.isLowStock = jest.fn().mockReturnValue(false);
      mockPartRepository.findById.mockResolvedValue(mockPart);
      mockPartRepository.update.mockResolvedValue(updatedPart);

      const result = await service.update('test-uuid', {
        name: 'Premium Oil Filter',
      });

      expect(result.name).toBe('Premium Oil Filter');
    });

    it('should throw AppErrorException if part not found', async () => {
      mockPartRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(AppErrorException);
    });

    it('should update code successfully when no conflict', async () => {
      const updatedPart = { ...mockPart, code: 'PRT002' };
      updatedPart.isLowStock = jest.fn().mockReturnValue(false);
      mockPartRepository.findById.mockResolvedValue(mockPart);
      mockPartRepository.findByCode.mockResolvedValue(null);
      mockPartRepository.update.mockResolvedValue(updatedPart);

      const result = await service.update('test-uuid', { code: 'prt002' });

      expect(result.code).toBe('PRT002');
      expect(mockPartRepository.update).toHaveBeenCalledWith(
        'test-uuid',
        expect.objectContaining({ code: 'PRT002' }),
      );
    });

    it('should allow updating to same code (own part)', async () => {
      const updatedPart = { ...mockPart };
      updatedPart.isLowStock = jest.fn().mockReturnValue(false);
      mockPartRepository.findById.mockResolvedValue(mockPart);
      mockPartRepository.findByCode.mockResolvedValue(mockPart);
      mockPartRepository.update.mockResolvedValue(updatedPart);

      const result = await service.update('test-uuid', { code: 'PRT001' });

      expect(result.code).toBe('PRT001');
    });

    it('should throw AppErrorException if new code already exists', async () => {
      const anotherPart = { ...mockPart, id: 'another-uuid' };
      mockPartRepository.findById.mockResolvedValue(mockPart);
      mockPartRepository.findByCode.mockResolvedValue(anotherPart);

      await expect(
        service.update('test-uuid', { code: 'PRT002' }),
      ).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException if update returns null', async () => {
      mockPartRepository.findById.mockResolvedValue(mockPart);
      mockPartRepository.update.mockResolvedValue(null);

      await expect(
        service.update('test-uuid', { name: 'New Name' }),
      ).rejects.toThrow(AppErrorException);
    });
  });

  describe('delete', () => {
    it('should delete a part successfully', async () => {
      mockPartRepository.delete.mockResolvedValue(true);

      await expect(service.delete('test-uuid')).resolves.not.toThrow();
    });

    it('should throw AppErrorException if part not found', async () => {
      mockPartRepository.delete.mockResolvedValue(false);

      await expect(service.delete('non-existent')).rejects.toThrow(
        AppErrorException,
      );
    });
  });
});
