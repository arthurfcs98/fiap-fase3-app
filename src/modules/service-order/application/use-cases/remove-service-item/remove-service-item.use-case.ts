import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { ServiceOrderErrors } from '@/shared/domain/exceptions/errors';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import {
  IServiceOrderItemRepository,
  SERVICE_ORDER_ITEM_REPOSITORY,
} from '../../../domain/repositories/service-order-item.repository.interface';
import { ServiceOrderStatus } from '../../../domain/enums/service-order-status.enum';
import { RemoveServiceItemInput } from '../../dto/input/remove-item.input';
import { ServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class RemoveServiceItemUseCase implements IUseCase<
  RemoveServiceItemInput,
  ServiceOrderOutput
> {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
    @Inject(SERVICE_ORDER_ITEM_REPOSITORY)
    private readonly serviceItemRepository: IServiceOrderItemRepository,
  ) {}

  async execute(input: RemoveServiceItemInput): Promise<ServiceOrderOutput> {
    const order = await this.serviceOrderRepository.findById(input.orderId);
    if (!order) {
      throw ServiceOrderErrors.NOT_FOUND(input.orderId);
    }

    if (
      order.status !== ServiceOrderStatus.RECEIVED &&
      order.status !== ServiceOrderStatus.IN_DIAGNOSIS
    ) {
      throw ServiceOrderErrors.CANNOT_MODIFY_IN_STATUS(order.status);
    }

    const result = await this.serviceItemRepository.delete({
      id: input.itemId,
      serviceOrderId: input.orderId,
    });

    if (result.affected === 0) {
      throw ServiceOrderErrors.ITEM_NOT_FOUND(input.itemId);
    }

    await this.serviceOrderRepository.recalculateTotal(input.orderId);

    const updatedOrder = await this.serviceOrderRepository.findById(
      input.orderId,
    );
    return ServiceOrderMapper.toOutput(updatedOrder!);
  }

}
