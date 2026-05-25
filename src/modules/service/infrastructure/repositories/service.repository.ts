import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Service } from '../../domain/entities/service.entity';
import { IServiceRepository } from '../../domain/repositories/service.repository.interface';
import { ServiceOrmEntity } from '../entities/service.orm-entity';

@Injectable()
export class ServiceRepository implements IServiceRepository {
  constructor(
    @InjectRepository(ServiceOrmEntity)
    private readonly repository: Repository<ServiceOrmEntity>,
  ) {}

  async create(serviceData: Partial<Service>): Promise<Service> {
    const service = this.repository.create(serviceData);
    return this.repository.save(service);
  }

  async findAll(page: number, limit: number): Promise<[Service[], number]> {
    return this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Service | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<Service | null> {
    return this.repository.findOne({
      where: { code: code.toUpperCase() },
    });
  }

  async findByIds(ids: string[]): Promise<Service[]> {
    return this.repository.find({
      where: { id: In(ids) },
    });
  }

  async update(
    id: string,
    serviceData: Partial<Service>,
  ): Promise<Service | null> {
    await this.repository.update(id, serviceData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
