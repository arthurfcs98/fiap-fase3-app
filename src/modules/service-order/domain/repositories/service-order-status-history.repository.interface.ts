import { ServiceOrderStatusHistory } from "../entities/service-order-status-history.entity";

export interface IServiceOrderStatusHistoryRepository {
  create(
    history: Partial<ServiceOrderStatusHistory>,
  ): Promise<ServiceOrderStatusHistory>;
  findByServiceOrderId(
    serviceOrderId: string,
  ): Promise<ServiceOrderStatusHistory[]>;
  findLastByServiceOrderId(
    serviceOrderId: string,
  ): Promise<ServiceOrderStatusHistory | null>;
  getTimeByStatusForOrder(
    serviceOrderId: string,
  ): Promise<Record<string, number>>;
  getAverageTimeByStatus(): Promise<Record<string, number>>;
}

export const SERVICE_ORDER_STATUS_HISTORY_REPOSITORY = Symbol(
  "IServiceOrderStatusHistoryRepository",
);
