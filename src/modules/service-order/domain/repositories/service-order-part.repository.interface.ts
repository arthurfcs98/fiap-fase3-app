import { ServiceOrderPart } from '../entities/service-order-part.entity';

export interface IServiceOrderPartRepository {
  create(data: Partial<ServiceOrderPart>): ServiceOrderPart;
  save(item: ServiceOrderPart): Promise<ServiceOrderPart>;
  findOne(criteria: { where: Record<string, any> }): Promise<ServiceOrderPart | null>;
  delete(criteria: Record<string, any>): Promise<{ affected?: number | null }>;
}

export const SERVICE_ORDER_PART_REPOSITORY = Symbol('IServiceOrderPartRepository');
