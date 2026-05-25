import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { ServiceOrderErrors } from '@/shared/domain/exceptions/errors';
import { IStockService, STOCK_SERVICE } from '@/modules/part/domain/services/stock.service.interface';
import { INotificationService, NOTIFICATION_SERVICE } from '@/modules/notification/domain/services/notification.service.interface';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import {
  IServiceOrderStatusHistoryRepository,
  SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
} from '../../../domain/repositories/service-order-status-history.repository.interface';
import {
  ServiceOrderStatus,
  canTransitionTo,
  getStatusLabel,
} from '../../../domain/enums/service-order-status.enum';
import { ServiceOrder } from '../../../domain/entities/service-order.entity';
import { UpdateServiceOrderStatusInput } from '../../dto/input/update-service-order-status.input';
import { ServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class UpdateServiceOrderStatusUseCase
  implements IUseCase<UpdateServiceOrderStatusInput, ServiceOrderOutput>
{
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
    @Inject(SERVICE_ORDER_STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: IServiceOrderStatusHistoryRepository,
    @Inject(STOCK_SERVICE) private readonly stockService: IStockService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(
    input: UpdateServiceOrderStatusInput,
  ): Promise<ServiceOrderOutput> {
    const order = await this.serviceOrderRepository.findById(input.id);
    if (!order) {
      throw ServiceOrderErrors.NOT_FOUND(input.id);
    }

    if (!canTransitionTo(order.status, input.status)) {
      throw ServiceOrderErrors.INVALID_STATUS_TRANSITION(order.status, input.status);
    }

    const previousStatus = order.status;
    const updateData: Partial<ServiceOrder> = {
      status: input.status,
    };

    if (input.notes) {
      if (input.status === ServiceOrderStatus.AWAITING_APPROVAL) {
        updateData.diagnosisNotes = input.notes;
      } else {
        updateData.observations = order.observations
          ? `${order.observations}\n${input.notes}`
          : input.notes;
      }
    }

    if (input.status === ServiceOrderStatus.IN_PROGRESS) {
      updateData.startedAt = new Date();
    }

    if (input.status === ServiceOrderStatus.COMPLETED) {
      updateData.completedAt = new Date();
      // Deduct stock when order is completed
      await this.stockService.confirmStockDeduction(input.id);
    }

    if (input.status === ServiceOrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    if (input.status === ServiceOrderStatus.CANCELLED) {
      // Release all reserved stock when order is cancelled
      await this.stockService.releaseAllReservedStock(input.id);
    }

    await this.serviceOrderRepository.update(input.id, updateData);

    // Record status change in history
    await this.statusHistoryRepository.create({
      serviceOrderId: input.id,
      fromStatus: previousStatus,
      toStatus: input.status,
      changedAt: new Date(),
      notes: input.notes || null,
    });

    const updatedOrder = await this.serviceOrderRepository.findById(input.id);

    await this.notificationService.notifyStatusChange({
      orderNumber: updatedOrder!.orderNumber,
      customerName: updatedOrder!.customer!.name,
      customerEmail: updatedOrder!.customer!.email,
      vehicleDescription: `${updatedOrder!.vehicle!.brand} ${updatedOrder!.vehicle!.model}`,
      previousStatus: previousStatus,
      newStatus: input.status,
      newStatusLabel: getStatusLabel(input.status),
      customerId: updatedOrder!.customerId,
    });

    return ServiceOrderMapper.toOutput(updatedOrder!);
  }
}
