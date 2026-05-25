import { Injectable } from '@nestjs/common';
import { PartErrors } from '@/shared/domain/exceptions/errors';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PartOrmEntity } from '../entities/part.orm-entity';
import { StockMovementOrmEntity } from '../entities/stock-movement.orm-entity';
import { StockMovementType } from '../../domain/enums/stock-movement-type.enum';
import { IStockService } from '../../domain/services/stock.service.interface';
import { StockMovement } from '../../domain/entities/stock-movement.entity';

@Injectable()
export class StockService implements IStockService {
  constructor(
    @InjectRepository(PartOrmEntity)
    private readonly partRepository: Repository<PartOrmEntity>,
    @InjectRepository(StockMovementOrmEntity)
    private readonly stockMovementRepository: Repository<StockMovementOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async reserveStock(
    partId: string,
    quantity: number,
    serviceOrderId: string,
    notes?: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const part = await manager.findOne(PartOrmEntity, {
        where: { id: partId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!part) {
        throw PartErrors.NOT_FOUND(partId);
      }

      if (!part.hasAvailableStock(quantity)) {
        throw PartErrors.INSUFFICIENT_STOCK(partId);
      }

      const previousReserved = part.reservedQuantity;
      part.reservedQuantity += quantity;

      await manager.save(part);

      await manager.save(StockMovementOrmEntity, {
        partId,
        serviceOrderId,
        movementType: StockMovementType.RESERVE,
        quantity,
        previousStock: part.stockQuantity,
        newStock: part.stockQuantity,
        previousReserved,
        newReserved: part.reservedQuantity,
        reference: `OS:${serviceOrderId}`,
        notes: notes || 'Reserva de estoque para ordem de serviço',
      });
    });
  }

  async releaseStock(
    partId: string,
    quantity: number,
    serviceOrderId: string,
    notes?: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const part = await manager.findOne(PartOrmEntity, {
        where: { id: partId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!part) {
        throw PartErrors.NOT_FOUND(partId);
      }

      const previousReserved = part.reservedQuantity;
      part.reservedQuantity = Math.max(0, part.reservedQuantity - quantity);

      await manager.save(part);

      await manager.save(StockMovementOrmEntity, {
        partId,
        serviceOrderId,
        movementType: StockMovementType.RELEASE,
        quantity,
        previousStock: part.stockQuantity,
        newStock: part.stockQuantity,
        previousReserved,
        newReserved: part.reservedQuantity,
        reference: `OS:${serviceOrderId}`,
        notes: notes || 'Liberação de reserva de estoque',
      });
    });
  }

  async confirmStockDeduction(serviceOrderId: string): Promise<void> {
    const partQuantities = await this.getNetReservedQuantities(serviceOrderId);

    // Deduct from stock for each part
    await this.dataSource.transaction(async (manager) => {
      for (const [partId, quantity] of Object.entries(partQuantities)) {
        if (quantity <= 0) continue;

        const part = await manager.findOne(PartOrmEntity, {
          where: { id: partId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!part) continue;

        const previousStock = part.stockQuantity;
        const previousReserved = part.reservedQuantity;

        part.stockQuantity -= quantity;
        part.reservedQuantity = Math.max(0, part.reservedQuantity - quantity);

        await manager.save(part);

        await manager.save(StockMovementOrmEntity, {
          partId,
          serviceOrderId,
          movementType: StockMovementType.OUT,
          quantity,
          previousStock,
          newStock: part.stockQuantity,
          previousReserved,
          newReserved: part.reservedQuantity,
          reference: `OS:${serviceOrderId}`,
          notes: 'Baixa de estoque - OS concluída',
        });
      }
    });
  }

  async releaseAllReservedStock(serviceOrderId: string): Promise<void> {
    const partQuantities = await this.getNetReservedQuantities(serviceOrderId);

    // Release all remaining reservations
    for (const [partId, quantity] of Object.entries(partQuantities)) {
      if (quantity > 0) {
        await this.releaseStock(partId, quantity, serviceOrderId, 'Liberação por cancelamento da OS');
      }
    }
  }

  private async getNetReservedQuantities(serviceOrderId: string): Promise<Record<string, number>> {
    const reservations = await this.stockMovementRepository.find({
      where: { serviceOrderId, movementType: StockMovementType.RESERVE },
    });

    const releases = await this.stockMovementRepository.find({
      where: { serviceOrderId, movementType: StockMovementType.RELEASE },
    });

    const partQuantities: Record<string, number> = {};

    for (const r of reservations) {
      partQuantities[r.partId] = (partQuantities[r.partId] || 0) + r.quantity;
    }

    for (const r of releases) {
      partQuantities[r.partId] = (partQuantities[r.partId] || 0) - r.quantity;
    }

    return partQuantities;
  }

  async getMovementsByPart(partId: string): Promise<StockMovement[]> {
    return this.stockMovementRepository.find({
      where: { partId },
      order: { createdAt: 'DESC' },
    });
  }

  async getMovementsByServiceOrder(serviceOrderId: string): Promise<StockMovement[]> {
    return this.stockMovementRepository.find({
      where: { serviceOrderId },
      order: { createdAt: 'DESC' },
      relations: ['part'],
    });
  }
}
