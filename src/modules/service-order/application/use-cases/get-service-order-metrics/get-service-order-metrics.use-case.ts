import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { ServiceOrderErrors } from '@/shared/domain/exceptions/errors';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import {
  IServiceOrderStatusHistoryRepository,
  SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
} from '../../../domain/repositories/service-order-status-history.repository.interface';
import { ServiceOrderMetricsOutput } from '../../dto/output/service-order.output';

export class GetServiceOrderMetricsInput {
  orderId: string;
}

@Injectable()
export class GetServiceOrderMetricsUseCase
  implements IUseCase<GetServiceOrderMetricsInput, ServiceOrderMetricsOutput>
{
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
    @Inject(SERVICE_ORDER_STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: IServiceOrderStatusHistoryRepository,
  ) {}

  async execute(
    input: GetServiceOrderMetricsInput,
  ): Promise<ServiceOrderMetricsOutput> {
    const order = await this.serviceOrderRepository.findById(input.orderId);

    if (!order) {
      throw ServiceOrderErrors.NOT_FOUND(input.orderId);
    }

    const timeByStatus =
      await this.statusHistoryRepository.getTimeByStatusForOrder(input.orderId);

    const totalTimeMinutes = order.completedAt
      ? Math.round(
          (order.completedAt.getTime() - order.createdAt.getTime()) / 60000,
        )
      : null;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalTimeMinutes,
      timeByStatus,
      createdAt: order.createdAt,
      startedAt: order.startedAt || null,
      completedAt: order.completedAt || null,
      deliveredAt: order.deliveredAt || null,
    };
  }
}
