import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { ServiceOrder } from '../../domain/entities/service-order.entity';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';
import {
  IServiceOrderRepository,
  ServiceOrderFilters,
} from '../../domain/repositories/service-order.repository.interface';
import { ServiceOrderOrmEntity } from '../entities/service-order.orm-entity';

@Injectable()
export class ServiceOrderRepository implements IServiceOrderRepository {
  constructor(
    @InjectRepository(ServiceOrderOrmEntity)
    private readonly repository: Repository<ServiceOrderOrmEntity>,
  ) {}

  async create(serviceOrderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    const serviceOrder = this.repository.create(serviceOrderData);
    return this.repository.save(serviceOrder);
  }

  async findAll(
    page: number,
    limit: number,
    filters?: ServiceOrderFilters,
  ): Promise<[ServiceOrder[], number]> {
    const queryBuilder = this.repository
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.vehicle', 'vehicle')
      .leftJoinAndSelect('so.serviceItems', 'serviceItems')
      .leftJoinAndSelect('serviceItems.service', 'service')
      .leftJoinAndSelect('so.partItems', 'partItems')
      .leftJoinAndSelect('partItems.part', 'part');

    // Exclude finished orders by default
    if (!filters?.includeFinished) {
      queryBuilder.andWhere('so.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [
          ServiceOrderStatus.COMPLETED,
          ServiceOrderStatus.DELIVERED,
        ],
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('so.status = :status', { status: filters.status });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('so.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters?.vehicleId) {
      queryBuilder.andWhere('so.vehicleId = :vehicleId', {
        vehicleId: filters.vehicleId,
      });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere('so.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    // Order by status priority (lower = higher priority), then oldest first
    queryBuilder
      .orderBy(
        `CASE so.status
          WHEN '${ServiceOrderStatus.IN_PROGRESS}' THEN 1
          WHEN '${ServiceOrderStatus.AWAITING_APPROVAL}' THEN 2
          WHEN '${ServiceOrderStatus.IN_DIAGNOSIS}' THEN 3
          WHEN '${ServiceOrderStatus.RECEIVED}' THEN 4
          WHEN '${ServiceOrderStatus.AWAITING_START}' THEN 5
          WHEN '${ServiceOrderStatus.CANCELLED}' THEN 6
          WHEN '${ServiceOrderStatus.COMPLETED}' THEN 7
          WHEN '${ServiceOrderStatus.DELIVERED}' THEN 8
          ELSE 9
        END`,
        'ASC',
      )
      .addOrderBy('so.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    return queryBuilder.getManyAndCount();
  }

  async findById(id: string): Promise<ServiceOrder | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'customer',
        'vehicle',
        'serviceItems',
        'serviceItems.service',
        'partItems',
        'partItems.part',
      ],
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<ServiceOrder | null> {
    return this.repository.findOne({
      where: { orderNumber },
      relations: [
        'customer',
        'vehicle',
        'serviceItems',
        'serviceItems.service',
        'partItems',
        'partItems.part',
      ],
    });
  }

  async update(
    id: string,
    serviceOrderData: Partial<ServiceOrder>,
  ): Promise<ServiceOrder | null> {
    await this.repository.update(id, serviceOrderData);
    return this.findById(id);
  }

  async recalculateTotal(orderId: string): Promise<void> {
    const order = await this.findById(orderId);
    if (!order) return;

    const total = order.calculateTotal();
    await this.repository.update(orderId, { totalAmount: total });
  }

  async getNextOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `OS-${year}-`;

    const lastOrder = await this.repository
      .createQueryBuilder('so')
      .where('so.orderNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('so.orderNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  async getOrderCountByStatus(): Promise<Record<string, number>> {
    const result: Record<string, number> = {};

    for (const status of Object.values(ServiceOrderStatus)) {
      result[status] = 0;
    }

    const counts = await this.repository
      .createQueryBuilder('so')
      .select('so.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('so.status')
      .getRawMany();

    for (const row of counts) {
      result[row.status] = parseInt(row.count, 10);
    }

    return result;
  }

  async getAverageCompletionTime(): Promise<number | null> {
    const result = await this.repository
      .createQueryBuilder('so')
      .select(
        'AVG(EXTRACT(EPOCH FROM (so.completedAt - so.createdAt)) / 60)',
        'avgMinutes',
      )
      .where('so.completedAt IS NOT NULL')
      .getRawOne();

    return result?.avgMinutes ? Math.round(parseFloat(result.avgMinutes)) : null;
  }

  async getTotalRevenue(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('so')
      .select('SUM(so.totalAmount)', 'total')
      .where('so.status IN (:...statuses)', {
        statuses: [ServiceOrderStatus.COMPLETED, ServiceOrderStatus.DELIVERED],
      })
      .getRawOne();

    return result?.total ? parseFloat(result.total) : 0;
  }

  async getOrdersCountByDateRange(
    startDate: Date,
    endDate: Date,
    status?: ServiceOrderStatus,
  ): Promise<number> {
    const whereCondition: any = {
      createdAt: Between(startDate, endDate),
    };

    if (status) {
      whereCondition.status = status;
    }

    return this.repository.count({ where: whereCondition });
  }

  async getCompletedOrdersCountByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.repository.count({
      where: {
        completedAt: Between(startDate, endDate),
        status: In([ServiceOrderStatus.COMPLETED, ServiceOrderStatus.DELIVERED]),
      },
    });
  }
}
