import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { StockService } from '@/modules/part/infrastructure/services/stock.service';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import { Part } from '@/modules/part/domain/entities/part.entity';
import { StockMovement } from '@/modules/part/domain/entities/stock-movement.entity';
import { PartOrmEntity } from '@/modules/part/infrastructure/entities/part.orm-entity';
import { StockMovementOrmEntity } from '@/modules/part/infrastructure/entities/stock-movement.orm-entity';
import { StockMovementType } from '@/modules/part/domain/enums/stock-movement-type.enum';

describe('StockService', () => {
  let service: StockService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let partRepository: jest.Mocked<Repository<Part>>;
  let stockMovementRepository: jest.Mocked<Repository<StockMovement>>;
  let dataSource: jest.Mocked<DataSource>;
  let mockManager: jest.Mocked<EntityManager>;

  const mockPart = (): Part => {
    const part = new Part();
    part.id = 'part-uuid';
    part.code = 'PRT001';
    part.name = 'Oil Filter';
    part.stockQuantity = 100;
    part.reservedQuantity = 0;
    part.minimumStock = 10;
    part.unitPrice = 25.5;
    return part;
  };

  const mockStockMovement = (overrides: Partial<StockMovement> = {}): StockMovement => {
    const movement = new StockMovement();
    movement.id = 'movement-uuid';
    movement.partId = 'part-uuid';
    movement.serviceOrderId = 'order-uuid';
    movement.movementType = StockMovementType.RESERVE;
    movement.quantity = 10;
    movement.previousStock = 100;
    movement.newStock = 100;
    movement.previousReserved = 0;
    movement.newReserved = 10;
    movement.createdAt = new Date();
    return Object.assign(movement, overrides);
  };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const mockDataSource = {
      transaction: jest.fn((callback) => callback(mockManager)),
    };

    const mockPartRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockStockMovementRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: getRepositoryToken(PartOrmEntity),
          useValue: mockPartRepository,
        },
        {
          provide: getRepositoryToken(StockMovementOrmEntity),
          useValue: mockStockMovementRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    partRepository = module.get(getRepositoryToken(PartOrmEntity));
    stockMovementRepository = module.get(getRepositoryToken(StockMovementOrmEntity));
    dataSource = module.get(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reserveStock', () => {
    it('should reserve stock successfully', async () => {
      const part = mockPart();
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockResolvedValue(part);

      await service.reserveStock('part-uuid', 10, 'order-uuid');

      expect(mockManager.findOne).toHaveBeenCalledWith(PartOrmEntity, {
        where: { id: 'part-uuid' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({
        reservedQuantity: 10,
      }));
      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          partId: 'part-uuid',
          serviceOrderId: 'order-uuid',
          movementType: StockMovementType.RESERVE,
          quantity: 10,
        }),
      );
    });

    it('should reserve stock with custom notes', async () => {
      const part = mockPart();
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockResolvedValue(part);

      await service.reserveStock('part-uuid', 10, 'order-uuid', 'Custom reservation note');

      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          notes: 'Custom reservation note',
        }),
      );
    });

    it('should throw AppErrorException if part not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(
        service.reserveStock('non-existent', 10, 'order-uuid'),
      ).rejects.toThrow(AppErrorException);
    });

    it('should throw AppErrorException for insufficient available stock', async () => {
      const part = mockPart();
      part.stockQuantity = 50;
      part.reservedQuantity = 45; // Only 5 available
      mockManager.findOne.mockResolvedValue(part);

      await expect(
        service.reserveStock('part-uuid', 10, 'order-uuid'),
      ).rejects.toThrow(AppErrorException);
    });

    it('should increment reservedQuantity correctly', async () => {
      const part = mockPart();
      part.reservedQuantity = 20;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.reserveStock('part-uuid', 15, 'order-uuid');

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({
        reservedQuantity: 35,
      }));
    });

    it('should record previous and new reserved quantities in movement', async () => {
      const part = mockPart();
      part.reservedQuantity = 10;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.reserveStock('part-uuid', 5, 'order-uuid');

      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          previousReserved: 10,
          newReserved: 15,
        }),
      );
    });
  });

  describe('releaseStock', () => {
    it('should release stock successfully', async () => {
      const part = mockPart();
      part.reservedQuantity = 20;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockResolvedValue(part);

      await service.releaseStock('part-uuid', 10, 'order-uuid');

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({
        reservedQuantity: 10,
      }));
      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          movementType: StockMovementType.RELEASE,
          quantity: 10,
        }),
      );
    });

    it('should release stock with custom notes', async () => {
      const part = mockPart();
      part.reservedQuantity = 20;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockResolvedValue(part);

      await service.releaseStock('part-uuid', 10, 'order-uuid', 'Custom release note');

      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          notes: 'Custom release note',
        }),
      );
    });

    it('should throw AppErrorException if part not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(
        service.releaseStock('non-existent', 10, 'order-uuid'),
      ).rejects.toThrow(AppErrorException);
    });

    it('should not allow reservedQuantity to go below zero', async () => {
      const part = mockPart();
      part.reservedQuantity = 5;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.releaseStock('part-uuid', 10, 'order-uuid');

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({
        reservedQuantity: 0,
      }));
    });

    it('should record movement even when releasing more than reserved', async () => {
      const part = mockPart();
      part.reservedQuantity = 5;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.releaseStock('part-uuid', 10, 'order-uuid');

      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          previousReserved: 5,
          newReserved: 0,
          quantity: 10,
        }),
      );
    });
  });

  describe('confirmStockDeduction', () => {
    it('should deduct stock for parts with net positive reservations', async () => {
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
        mockStockMovement({ partId: 'part-1', quantity: 5, movementType: StockMovementType.RESERVE }),
      ];
      const releases: StockMovement[] = [];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      const part = mockPart();
      part.id = 'part-1';
      part.reservedQuantity = 15;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.confirmStockDeduction('order-uuid');

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({
        stockQuantity: 85,
        reservedQuantity: 0,
      }));
      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          movementType: StockMovementType.OUT,
          quantity: 15,
        }),
      );
    });

    it('should handle multiple parts', async () => {
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
        mockStockMovement({ partId: 'part-2', quantity: 5, movementType: StockMovementType.RESERVE }),
      ];
      const releases: StockMovement[] = [];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      const part1 = mockPart();
      part1.id = 'part-1';
      part1.reservedQuantity = 10;

      const part2 = mockPart();
      part2.id = 'part-2';
      part2.reservedQuantity = 5;

      mockManager.findOne
        .mockResolvedValueOnce(part1)
        .mockResolvedValueOnce(part2);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.confirmStockDeduction('order-uuid');

      expect(mockManager.findOne).toHaveBeenCalledTimes(2);
      expect(mockManager.save).toHaveBeenCalledTimes(4); // 2 parts + 2 movements
    });

    it('should skip parts with net quantity <= 0', async () => {
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
      ];
      const releases = [
        mockStockMovement({ partId: 'part-1', quantity: 15, movementType: StockMovementType.RELEASE }),
      ];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      await service.confirmStockDeduction('order-uuid');

      expect(mockManager.findOne).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should skip if part not found in database', async () => {
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
      ];
      const releases: StockMovement[] = [];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      mockManager.findOne.mockResolvedValue(null);

      await service.confirmStockDeduction('order-uuid');

      expect(mockManager.findOne).toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should calculate net quantity correctly with mixed reserves and releases', async () => {
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 20, movementType: StockMovementType.RESERVE }),
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
      ];
      const releases = [
        mockStockMovement({ partId: 'part-1', quantity: 5, movementType: StockMovementType.RELEASE }),
      ];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      const part = mockPart();
      part.id = 'part-1';
      part.reservedQuantity = 25;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.confirmStockDeduction('order-uuid');

      // Net = 20 + 10 - 5 = 25
      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({
        stockQuantity: 75,
      }));
      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          quantity: 25,
        }),
      );
    });

    it('should handle empty reservations', async () => {
      stockMovementRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.confirmStockDeduction('order-uuid');

      expect(mockManager.findOne).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should handle releases for parts not in reservations', async () => {
      // Part has only releases, no reservations
      const reservations: StockMovement[] = [];
      const releases = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RELEASE }),
      ];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      await service.confirmStockDeduction('order-uuid');

      // Net for part-1 = 0 - 10 = -10, so it should be skipped
      expect(mockManager.findOne).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should initialize partQuantities entry from release when no prior reservation', async () => {
      // Part-2 only has releases (edge case - should result in negative net)
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
      ];
      const releases = [
        mockStockMovement({ partId: 'part-2', quantity: 5, movementType: StockMovementType.RELEASE }),
      ];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      const part = mockPart();
      part.id = 'part-1';
      part.reservedQuantity = 10;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.confirmStockDeduction('order-uuid');

      // Only part-1 should be processed (net = 10), part-2 has negative net
      expect(mockManager.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('releaseAllReservedStock', () => {
    it('should release all reserved stock for service order', async () => {
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
      ];
      const releases: StockMovement[] = [];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      const part = mockPart();
      part.id = 'part-1';
      part.reservedQuantity = 10;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.releaseAllReservedStock('order-uuid');

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({
        reservedQuantity: 0,
      }));
      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          movementType: StockMovementType.RELEASE,
          notes: 'Liberação por cancelamento da OS',
        }),
      );
    });

    it('should handle multiple parts', async () => {
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
        mockStockMovement({ partId: 'part-2', quantity: 5, movementType: StockMovementType.RESERVE }),
      ];
      const releases: StockMovement[] = [];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      const part1 = mockPart();
      part1.id = 'part-1';
      part1.reservedQuantity = 10;

      const part2 = mockPart();
      part2.id = 'part-2';
      part2.reservedQuantity = 5;

      mockManager.findOne
        .mockResolvedValueOnce(part1)
        .mockResolvedValueOnce(part2);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.releaseAllReservedStock('order-uuid');

      expect(mockManager.findOne).toHaveBeenCalledTimes(2);
    });

    it('should skip parts with net quantity <= 0', async () => {
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
      ];
      const releases = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RELEASE }),
      ];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      await service.releaseAllReservedStock('order-uuid');

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should calculate net correctly with partial releases', async () => {
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 20, movementType: StockMovementType.RESERVE }),
      ];
      const releases = [
        mockStockMovement({ partId: 'part-1', quantity: 5, movementType: StockMovementType.RELEASE }),
      ];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      const part = mockPart();
      part.id = 'part-1';
      part.reservedQuantity = 15;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.releaseAllReservedStock('order-uuid');

      // Should release net = 20 - 5 = 15
      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          quantity: 15,
        }),
      );
    });

    it('should handle releases for parts not in reservations', async () => {
      // Only releases exist, no reservations
      const reservations: StockMovement[] = [];
      const releases = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RELEASE }),
      ];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      await service.releaseAllReservedStock('order-uuid');

      // Net for part-1 = 0 - 10 = -10, should not trigger release
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should initialize partQuantities entry from release when no prior reservation', async () => {
      // Part-2 only has releases
      const reservations = [
        mockStockMovement({ partId: 'part-1', quantity: 10, movementType: StockMovementType.RESERVE }),
      ];
      const releases = [
        mockStockMovement({ partId: 'part-2', quantity: 5, movementType: StockMovementType.RELEASE }),
      ];

      stockMovementRepository.find
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce(releases);

      const part = mockPart();
      part.id = 'part-1';
      part.reservedQuantity = 10;
      mockManager.findOne.mockResolvedValue(part);
      mockManager.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.releaseAllReservedStock('order-uuid');

      // Only part-1 should be released (net = 10), part-2 has negative net
      expect(mockManager.save).toHaveBeenCalledWith(
        StockMovementOrmEntity,
        expect.objectContaining({
          partId: 'part-1',
          quantity: 10,
        }),
      );
    });
  });

  describe('getMovementsByPart', () => {
    it('should return movements for a part ordered by createdAt DESC', async () => {
      const movements = [
        mockStockMovement({ createdAt: new Date('2024-01-02') }),
        mockStockMovement({ createdAt: new Date('2024-01-01') }),
      ];
      stockMovementRepository.find.mockResolvedValue(movements);

      const result = await service.getMovementsByPart('part-uuid');

      expect(stockMovementRepository.find).toHaveBeenCalledWith({
        where: { partId: 'part-uuid' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no movements found', async () => {
      stockMovementRepository.find.mockResolvedValue([]);

      const result = await service.getMovementsByPart('part-uuid');

      expect(result).toHaveLength(0);
    });
  });

  describe('getMovementsByServiceOrder', () => {
    it('should return movements for a service order with part relation', async () => {
      const movements = [
        mockStockMovement({ serviceOrderId: 'order-uuid' }),
      ];
      stockMovementRepository.find.mockResolvedValue(movements);

      const result = await service.getMovementsByServiceOrder('order-uuid');

      expect(stockMovementRepository.find).toHaveBeenCalledWith({
        where: { serviceOrderId: 'order-uuid' },
        order: { createdAt: 'DESC' },
        relations: ['part'],
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array if no movements found', async () => {
      stockMovementRepository.find.mockResolvedValue([]);

      const result = await service.getMovementsByServiceOrder('order-uuid');

      expect(result).toHaveLength(0);
    });
  });
});
