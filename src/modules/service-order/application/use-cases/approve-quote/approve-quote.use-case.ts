import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { ServiceOrderErrors } from '@/shared/domain/exceptions/errors';
import { INotificationService, NOTIFICATION_SERVICE } from '@/modules/notification/domain/services/notification.service.interface';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import {
  IServiceOrderStatusHistoryRepository,
  SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
} from '../../../domain/repositories/service-order-status-history.repository.interface';
import { ServiceOrderStatus, getStatusLabel } from '../../../domain/enums/service-order-status.enum';
import { FindServiceOrderByOrderNumberInput } from '../../dto/input/query-service-order.input';
import { PublicServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class ApproveQuoteUseCase
  implements IUseCase<FindServiceOrderByOrderNumberInput, PublicServiceOrderOutput>
{
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
    @Inject(SERVICE_ORDER_STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: IServiceOrderStatusHistoryRepository,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(
    input: FindServiceOrderByOrderNumberInput,
  ): Promise<PublicServiceOrderOutput> {
    const order = await this.serviceOrderRepository.findByOrderNumber(
      input.orderNumber,
    );
    if (!order) {
      throw ServiceOrderErrors.ORDER_BY_NUMBER_NOT_FOUND(input.orderNumber);
    }

    if (order.status !== ServiceOrderStatus.AWAITING_APPROVAL) {
      throw ServiceOrderErrors.INVALID_STATUS_TRANSITION(order.status, ServiceOrderStatus.AWAITING_START);
    }

    const previousStatus = order.status;
    await this.serviceOrderRepository.update(order.id, {
      status: ServiceOrderStatus.AWAITING_START,
    });

    // Record status change in history
    await this.statusHistoryRepository.create({
      serviceOrderId: order.id,
      fromStatus: previousStatus,
      toStatus: ServiceOrderStatus.AWAITING_START,
      changedAt: new Date(),
      notes: 'Orçamento aprovado pelo cliente',
    });

    const updatedOrder = await this.serviceOrderRepository.findByOrderNumber(
      input.orderNumber,
    );

    await this.notificationService.notifyStatusChange({
      orderNumber: updatedOrder!.orderNumber,
      customerName: updatedOrder!.customer!.name,
      customerEmail: updatedOrder!.customer!.email,
      vehicleDescription: `${updatedOrder!.vehicle!.brand} ${updatedOrder!.vehicle!.model}`,
      previousStatus: previousStatus,
      newStatus: ServiceOrderStatus.AWAITING_START,
      newStatusLabel: getStatusLabel(ServiceOrderStatus.AWAITING_START),
      customerId: updatedOrder!.customerId,
    });

    return ServiceOrderMapper.toPublicOutput(updatedOrder!);
  }
}
