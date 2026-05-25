import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { ServiceOrderErrors } from '@/shared/domain/exceptions/errors';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { FindServiceOrderByOrderNumberInput } from '../../dto/input/query-service-order.input';
import { PublicServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class FindServiceOrderByOrderNumberUseCase implements IUseCase<
  FindServiceOrderByOrderNumberInput,
  PublicServiceOrderOutput
> {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
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
    return ServiceOrderMapper.toPublicOutput(order);
  }
}
