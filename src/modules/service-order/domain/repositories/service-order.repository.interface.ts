import { ServiceOrder } from '../entities/service-order.entity';
import { ServiceOrderStatus } from '../enums/service-order-status.enum';

export interface ServiceOrderFilters {
  status?: ServiceOrderStatus;
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  includeFinished?: boolean;
}

export interface IServiceOrderRepository {
  create(serviceOrder: Partial<ServiceOrder>): Promise<ServiceOrder>;
  findAll(
    page: number,
    limit: number,
    filters?: ServiceOrderFilters,
  ): Promise<[ServiceOrder[], number]>;
  findById(id: string): Promise<ServiceOrder | null>;
  findByOrderNumber(orderNumber: string): Promise<ServiceOrder | null>;
  update(
    id: string,
    serviceOrder: Partial<ServiceOrder>,
  ): Promise<ServiceOrder | null>;
  getNextOrderNumber(): Promise<string>;
  recalculateTotal(orderId: string): Promise<void>;

  // Metrics methods
  getOrderCountByStatus(): Promise<Record<string, number>>;
  getAverageCompletionTime(): Promise<number | null>;
  getTotalRevenue(): Promise<number>;
  getOrdersCountByDateRange(
    startDate: Date,
    endDate: Date,
    status?: ServiceOrderStatus,
  ): Promise<number>;
  getCompletedOrdersCountByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<number>;
}

export const SERVICE_ORDER_REPOSITORY = Symbol('IServiceOrderRepository');
