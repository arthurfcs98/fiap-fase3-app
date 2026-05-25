import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { ServiceOrderErrors } from '@/shared/domain/exceptions/errors';
import { IStockService, STOCK_SERVICE } from '@/modules/part/domain/services/stock.service.interface';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import {
  IServiceOrderPartRepository,
  SERVICE_ORDER_PART_REPOSITORY,
} from '../../../domain/repositories/service-order-part.repository.interface';
import { ServiceOrderStatus } from '../../../domain/enums/service-order-status.enum';
import { RemovePartItemInput } from '../../dto/input/remove-item.input';
import { ServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class RemovePartItemUseCase
  implements IUseCase<RemovePartItemInput, ServiceOrderOutput>
{
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
    @Inject(SERVICE_ORDER_PART_REPOSITORY)
    private readonly partItemRepository: IServiceOrderPartRepository,
    @Inject(STOCK_SERVICE) private readonly stockService: IStockService,
  ) {}

  async execute(input: RemovePartItemInput): Promise<ServiceOrderOutput> {
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

    // Find the part item to get quantity before deletion
    const partItem = await this.partItemRepository.findOne({
      where: { id: input.itemId, serviceOrderId: input.orderId },
    });

    if (!partItem) {
      throw ServiceOrderErrors.ITEM_NOT_FOUND(input.itemId);
    }

    // Release the reserved stock
    await this.stockService.releaseStock(
      partItem.partId,
      partItem.quantity,
      input.orderId,
    );

    await this.partItemRepository.delete({
      id: input.itemId,
      serviceOrderId: input.orderId,
    });

    await this.serviceOrderRepository.recalculateTotal(input.orderId);

    const updatedOrder = await this.serviceOrderRepository.findById(
      input.orderId,
    );
    return ServiceOrderMapper.toOutput(updatedOrder!);
  }

}
