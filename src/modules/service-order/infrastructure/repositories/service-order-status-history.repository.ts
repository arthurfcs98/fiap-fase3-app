import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrderStatusHistory } from '../../domain/entities/service-order-status-history.entity';
import { IServiceOrderStatusHistoryRepository } from '../../domain/repositories/service-order-status-history.repository.interface';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';
import { ServiceOrderStatusHistoryOrmEntity } from '../entities/service-order-status-history.orm-entity';

@Injectable()
export class ServiceOrderStatusHistoryRepository
  implements IServiceOrderStatusHistoryRepository
{
  constructor(
    @InjectRepository(ServiceOrderStatusHistoryOrmEntity)
    private readonly repository: Repository<ServiceOrderStatusHistoryOrmEntity>,
  ) {}

  async create(
    historyData: Partial<ServiceOrderStatusHistory>,
  ): Promise<ServiceOrderStatusHistory> {
    const history = this.repository.create(historyData);
    return this.repository.save(history);
  }

  async findByServiceOrderId(
    serviceOrderId: string,
  ): Promise<ServiceOrderStatusHistory[]> {
    return this.repository.find({
      where: { serviceOrderId },
      order: { changedAt: 'ASC' },
    });
  }

  async findLastByServiceOrderId(
    serviceOrderId: string,
  ): Promise<ServiceOrderStatusHistory | null> {
    return this.repository.findOne({
      where: { serviceOrderId },
      order: { changedAt: 'DESC' },
    });
  }

  async getTimeByStatusForOrder(
    serviceOrderId: string,
  ): Promise<Record<string, number>> {
    const result: Record<string, number> = {};

    // Initialize all statuses with 0
    for (const status of Object.values(ServiceOrderStatus)) {
      result[status] = 0;
    }

    const entries = await this.findByServiceOrderId(serviceOrderId);

    if (entries.length === 0) {
      return result;
    }

    // Calculate time in each status
    for (let i = 0; i < entries.length; i++) {
      const current = entries[i];
      const nextTime =
        i < entries.length - 1
          ? entries[i + 1].changedAt.getTime()
          : Date.now();

      const durationMinutes = Math.round(
        (nextTime - current.changedAt.getTime()) / (1000 * 60),
      );

      result[current.toStatus] += durationMinutes;
    }

    return result;
  }

  async getAverageTimeByStatus(): Promise<Record<string, number>> {
    const result: Record<string, number> = {};

    for (const status of Object.values(ServiceOrderStatus)) {
      result[status] = 0;
    }

    // Get all history entries grouped by service order
    const allEntries = await this.repository.find({
      order: { serviceOrderId: 'ASC', changedAt: 'ASC' },
    });

    if (allEntries.length === 0) {
      return result;
    }

    // Group entries by service order
    const entriesByOrder = new Map<string, ServiceOrderStatusHistory[]>();
    for (const entry of allEntries) {
      const orderEntries = entriesByOrder.get(entry.serviceOrderId) || [];
      orderEntries.push(entry);
      entriesByOrder.set(entry.serviceOrderId, orderEntries);
    }

    // Calculate time per status for each order, then average
    const statusTotals: Record<string, number[]> = {};
    for (const status of Object.values(ServiceOrderStatus)) {
      statusTotals[status] = [];
    }

    for (const [, entries] of entriesByOrder) {
      for (let i = 0; i < entries.length; i++) {
        const current = entries[i];
        const nextTime =
          i < entries.length - 1
            ? entries[i + 1].changedAt.getTime()
            : Date.now();

        const durationMinutes = Math.round(
          (nextTime - current.changedAt.getTime()) / (1000 * 60),
        );

        statusTotals[current.toStatus].push(durationMinutes);
      }
    }

    // Calculate averages
    for (const status of Object.values(ServiceOrderStatus)) {
      const times = statusTotals[status];
      if (times.length > 0) {
        result[status] = Math.round(
          times.reduce((sum, t) => sum + t, 0) / times.length,
        );
      }
    }

    return result;
  }
}
