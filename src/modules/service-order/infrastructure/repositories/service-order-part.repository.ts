import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrderPart } from '../../domain/entities/service-order-part.entity';
import { IServiceOrderPartRepository } from '../../domain/repositories/service-order-part.repository.interface';
import { ServiceOrderPartOrmEntity } from '../entities/service-order-part.orm-entity';

@Injectable()
export class ServiceOrderPartRepository implements IServiceOrderPartRepository {
  constructor(
    @InjectRepository(ServiceOrderPartOrmEntity)
    private readonly repository: Repository<ServiceOrderPartOrmEntity>,
  ) {}

  create(data: Partial<ServiceOrderPart>): ServiceOrderPartOrmEntity {
    return this.repository.create(data as Partial<ServiceOrderPartOrmEntity>);
  }

  async save(item: ServiceOrderPart): Promise<ServiceOrderPart> {
    return this.repository.save(item as ServiceOrderPartOrmEntity);
  }

  async findOne(criteria: { where: Record<string, any> }): Promise<ServiceOrderPart | null> {
    return this.repository.findOne(criteria);
  }

  async delete(criteria: Record<string, any>): Promise<{ affected?: number | null }> {
    return this.repository.delete(criteria);
  }
}
