import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import {
  IServiceOrderStatusHistoryRepository,
  SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
} from '../../../domain/repositories/service-order-status-history.repository.interface';
import { GeneralMetricsOutput } from '../../dto/output/service-order.output';

@Injectable()
export class GetGeneralMetricsUseCase
  implements IUseCase<void, GeneralMetricsOutput>
{
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
    @Inject(SERVICE_ORDER_STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: IServiceOrderStatusHistoryRepository,
  ) {}

  async execute(): Promise<GeneralMetricsOutput> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [
      ordersByStatus,
      averageCompletionTimeMinutes,
      totalRevenue,
      averageTimeByStatus,
      ordersCreatedToday,
      ordersCompletedToday,
    ] = await Promise.all([
      this.serviceOrderRepository.getOrderCountByStatus(),
      this.serviceOrderRepository.getAverageCompletionTime(),
      this.serviceOrderRepository.getTotalRevenue(),
      this.statusHistoryRepository.getAverageTimeByStatus(),
      this.serviceOrderRepository.getOrdersCountByDateRange(startOfDay, endOfDay),
      this.serviceOrderRepository.getCompletedOrdersCountByDateRange(startOfDay, endOfDay),
    ]);

    const totalOrders = Object.values(ordersByStatus).reduce((sum, count) => sum + count, 0);
    const completedOrders = ordersByStatus['COMPLETED'] + ordersByStatus['DELIVERED'];
    const averageTicket = completedOrders > 0 ? Math.round((totalRevenue / completedOrders) * 100) / 100 : null;

    return {
      totalOrders,
      ordersByStatus,
      averageCompletionTimeMinutes,
      averageTimeByStatus,
      totalRevenue,
      averageTicket,
      ordersCreatedToday,
      ordersCompletedToday,
    };
  }
}
