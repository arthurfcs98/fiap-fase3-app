import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { ServiceOrderErrors } from '@/shared/domain/exceptions/errors';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { FindServiceOrderByIdInput } from '../../dto/input/query-service-order.input';
import { ServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class FindServiceOrderByIdUseCase implements IUseCase<
  FindServiceOrderByIdInput,
  ServiceOrderOutput
> {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
  ) {}

  async execute(input: FindServiceOrderByIdInput): Promise<ServiceOrderOutput> {
    const order = await this.serviceOrderRepository.findById(input.id);
    if (!order) {
      throw ServiceOrderErrors.NOT_FOUND(input.id);
    }
    return ServiceOrderMapper.toOutput(order);
  }
}
