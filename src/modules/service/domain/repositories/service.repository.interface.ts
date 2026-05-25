import { Service } from '../entities/service.entity';

export interface IServiceRepository {
  create(service: Partial<Service>): Promise<Service>;
  findAll(page: number, limit: number): Promise<[Service[], number]>;
  findById(id: string): Promise<Service | null>;
  findByCode(code: string): Promise<Service | null>;
  findByIds(ids: string[]): Promise<Service[]>;
  update(id: string, service: Partial<Service>): Promise<Service | null>;
  delete(id: string): Promise<boolean>;
}

export const SERVICE_REPOSITORY = Symbol('IServiceRepository');
