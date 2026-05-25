import { Inject, Injectable } from '@nestjs/common';
import { IUseCase, PaginatedOutput } from '@/shared/application';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { ListServiceOrdersInput } from '../../dto/input/query-service-order.input';
import { ServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class ListServiceOrdersUseCase implements IUseCase<
  ListServiceOrdersInput,
  PaginatedOutput<ServiceOrderOutput>
> {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
  ) {}

  async execute(
    input: ListServiceOrdersInput,
  ): Promise<PaginatedOutput<ServiceOrderOutput>> {
    const [orders, total] = await this.serviceOrderRepository.findAll(
      input.page,
      input.limit,
      {
        status: input.status,
        customerId: input.customerId,
      },
    );

    return new PaginatedOutput({
      data: orders.map((order) => ServiceOrderMapper.toOutput(order)),
      total,
      page: input.page,
      limit: input.limit,
    });
  }
}
