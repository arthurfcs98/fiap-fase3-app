import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { ServiceOrderErrors, ServiceErrors } from '@/shared/domain/exceptions/errors';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '@/modules/service/domain/repositories/service.repository.interface';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import {
  IServiceOrderItemRepository,
  SERVICE_ORDER_ITEM_REPOSITORY,
} from '../../../domain/repositories/service-order-item.repository.interface';
import { ServiceOrderStatus } from '../../../domain/enums/service-order-status.enum';
import { AddServiceItemInput } from '../../dto/input/add-service-item.input';
import { ServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class AddServiceItemUseCase implements IUseCase<
  AddServiceItemInput,
  ServiceOrderOutput
> {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    @Inject(SERVICE_ORDER_ITEM_REPOSITORY)
    private readonly serviceItemRepository: IServiceOrderItemRepository,
  ) {}

  async execute(input: AddServiceItemInput): Promise<ServiceOrderOutput> {
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

    const service = await this.serviceRepository.findById(input.serviceId);
    if (!service) {
      throw ServiceErrors.NOT_FOUND(input.serviceId);
    }

    const subtotal = Number(service.basePrice) * input.quantity;

    const item = this.serviceItemRepository.create({
      serviceOrderId: input.orderId,
      serviceId: input.serviceId,
      quantity: input.quantity,
      unitPrice: service.basePrice,
      subtotal,
    });

    await this.serviceItemRepository.save(item);
    await this.serviceOrderRepository.recalculateTotal(input.orderId);

    const updatedOrder = await this.serviceOrderRepository.findById(
      input.orderId,
    );
    return ServiceOrderMapper.toOutput(updatedOrder!);
  }

}
