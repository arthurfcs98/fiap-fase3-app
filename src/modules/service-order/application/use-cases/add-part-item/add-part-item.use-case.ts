import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { ServiceOrderErrors, PartErrors } from '@/shared/domain/exceptions/errors';
import {
  IPartRepository,
  PART_REPOSITORY,
} from '@/modules/part/domain/repositories/part.repository.interface';
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
import { AddPartItemInput } from '../../dto/input/add-part-item.input';
import { ServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class AddPartItemUseCase
  implements IUseCase<AddPartItemInput, ServiceOrderOutput>
{
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
    @Inject(PART_REPOSITORY)
    private readonly partRepository: IPartRepository,
    @Inject(SERVICE_ORDER_PART_REPOSITORY)
    private readonly partItemRepository: IServiceOrderPartRepository,
    @Inject(STOCK_SERVICE) private readonly stockService: IStockService,
  ) {}

  async execute(input: AddPartItemInput): Promise<ServiceOrderOutput> {
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

    const part = await this.partRepository.findById(input.partId);
    if (!part) {
      throw PartErrors.NOT_FOUND(input.partId);
    }

    if (!part.hasAvailableStock(input.quantity)) {
      throw PartErrors.INSUFFICIENT_STOCK(input.partId);
    }

    // Reserve stock for this order
    await this.stockService.reserveStock(
      input.partId,
      input.quantity,
      input.orderId,
    );

    const subtotal = Number(part.unitPrice) * input.quantity;

    const item = this.partItemRepository.create({
      serviceOrderId: input.orderId,
      partId: input.partId,
      quantity: input.quantity,
      unitPrice: part.unitPrice,
      subtotal,
    });

    await this.partItemRepository.save(item);
    await this.serviceOrderRepository.recalculateTotal(input.orderId);

    const updatedOrder = await this.serviceOrderRepository.findById(
      input.orderId,
    );
    return ServiceOrderMapper.toOutput(updatedOrder!);
  }

}
