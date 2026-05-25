import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrderItem } from '../../domain/entities/service-order-item.entity';
import { IServiceOrderItemRepository } from '../../domain/repositories/service-order-item.repository.interface';
import { ServiceOrderItemOrmEntity } from '../entities/service-order-item.orm-entity';

@Injectable()
export class ServiceOrderItemRepository implements IServiceOrderItemRepository {
  constructor(
    @InjectRepository(ServiceOrderItemOrmEntity)
    private readonly repository: Repository<ServiceOrderItemOrmEntity>,
  ) {}

  create(data: Partial<ServiceOrderItem>): ServiceOrderItemOrmEntity {
    return this.repository.create(data as Partial<ServiceOrderItemOrmEntity>);
  }

  async save(item: ServiceOrderItem): Promise<ServiceOrderItem> {
    return this.repository.save(item as ServiceOrderItemOrmEntity);
  }

  async findOne(criteria: { where: Record<string, any> }): Promise<ServiceOrderItem | null> {
    return this.repository.findOne(criteria);
  }

  async delete(criteria: Record<string, any>): Promise<{ affected?: number | null }> {
    return this.repository.delete(criteria);
  }
}
