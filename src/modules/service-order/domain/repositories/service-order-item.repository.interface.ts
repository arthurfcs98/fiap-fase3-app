import { ServiceOrderItem } from '../entities/service-order-item.entity';

export interface IServiceOrderItemRepository {
  create(data: Partial<ServiceOrderItem>): ServiceOrderItem;
  save(item: ServiceOrderItem): Promise<ServiceOrderItem>;
  findOne(criteria: { where: Record<string, any> }): Promise<ServiceOrderItem | null>;
  delete(criteria: Record<string, any>): Promise<{ affected?: number | null }>;
}

export const SERVICE_ORDER_ITEM_REPOSITORY = Symbol('IServiceOrderItemRepository');
