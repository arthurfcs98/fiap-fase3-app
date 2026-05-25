import { Injectable } from '@nestjs/common';
import { ServiceOrderFilters } from '../../domain/repositories/service-order.repository.interface';
import {
  AddServiceOrderItemDto,
  AddServiceOrderPartDto,
  CreateServiceOrderDto,
  GeneralMetricsResponseDto,
  PaginatedServiceOrderResponseDto,
  PublicServiceOrderResponseDto,
  ServiceOrderMetricsResponseDto,
  ServiceOrderResponseDto,
  UpdateServiceOrderStatusDto,
} from '../dto';
import { CreateServiceOrderInput } from '../dto/input/create-service-order.input';
import { UpdateServiceOrderStatusInput } from '../dto/input/update-service-order-status.input';
import { AddServiceItemInput } from '../dto/input/add-service-item.input';
import { AddPartItemInput } from '../dto/input/add-part-item.input';
import {
  RemoveServiceItemInput,
  RemovePartItemInput,
} from '../dto/input/remove-item.input';
import {
  FindServiceOrderByIdInput,
  FindServiceOrderByOrderNumberInput,
  ListServiceOrdersInput,
} from '../dto/input/query-service-order.input';
import { ServiceOrderMapper } from '../mappers/service-order.mapper';
import {
  CreateServiceOrderUseCase,
  UpdateServiceOrderStatusUseCase,
  ApproveQuoteUseCase,
  RejectQuoteUseCase,
  AddServiceItemUseCase,
  AddPartItemUseCase,
  RemoveServiceItemUseCase,
  RemovePartItemUseCase,
  FindServiceOrderByIdUseCase,
  FindServiceOrderByOrderNumberUseCase,
  ListServiceOrdersUseCase,
  GetServiceOrderMetricsUseCase,
  GetGeneralMetricsUseCase,
} from '../use-cases';

/**
 * ServiceOrderService acts as a facade that delegates to individual use cases.
 * This maintains backward compatibility while allowing gradual migration to use cases.
 */
@Injectable()
export class ServiceOrderService {
  constructor(
    private readonly createServiceOrderUseCase: CreateServiceOrderUseCase,
    private readonly updateServiceOrderStatusUseCase: UpdateServiceOrderStatusUseCase,
    private readonly approveQuoteUseCase: ApproveQuoteUseCase,
    private readonly rejectQuoteUseCase: RejectQuoteUseCase,
    private readonly addServiceItemUseCase: AddServiceItemUseCase,
    private readonly addPartItemUseCase: AddPartItemUseCase,
    private readonly removeServiceItemUseCase: RemoveServiceItemUseCase,
    private readonly removePartItemUseCase: RemovePartItemUseCase,
    private readonly findServiceOrderByIdUseCase: FindServiceOrderByIdUseCase,
    private readonly findServiceOrderByOrderNumberUseCase: FindServiceOrderByOrderNumberUseCase,
    private readonly listServiceOrdersUseCase: ListServiceOrdersUseCase,
    private readonly getServiceOrderMetricsUseCase: GetServiceOrderMetricsUseCase,
    private readonly getGeneralMetricsUseCase: GetGeneralMetricsUseCase,
  ) {}

  async create(
    createDto: CreateServiceOrderDto,
  ): Promise<ServiceOrderResponseDto> {
    const input = CreateServiceOrderInput.fromDto(createDto);
    const output = await this.createServiceOrderUseCase.execute(input);
    return ServiceOrderMapper.toResponseDto(output);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: ServiceOrderFilters,
  ): Promise<PaginatedServiceOrderResponseDto> {
    const input = new ListServiceOrdersInput({
      page,
      limit,
      status: filters?.status,
      customerId: filters?.customerId,
    });
    const output = await this.listServiceOrdersUseCase.execute(input);
    return {
      data: output.data.map((o) => ServiceOrderMapper.toResponseDto(o)),
      total: output.total,
      page: output.page,
      limit: output.limit,
      totalPages: output.totalPages,
    };
  }

  async findById(id: string): Promise<ServiceOrderResponseDto> {
    const input = new FindServiceOrderByIdInput(id);
    const output = await this.findServiceOrderByIdUseCase.execute(input);
    return ServiceOrderMapper.toResponseDto(output);
  }

  async findByOrderNumber(
    orderNumber: string,
  ): Promise<PublicServiceOrderResponseDto> {
    const input = new FindServiceOrderByOrderNumberInput(orderNumber);
    const output =
      await this.findServiceOrderByOrderNumberUseCase.execute(input);
    return ServiceOrderMapper.toPublicResponseDto(output);
  }

  async updateStatus(
    id: string,
    updateDto: UpdateServiceOrderStatusDto,
  ): Promise<ServiceOrderResponseDto> {
    const input = UpdateServiceOrderStatusInput.fromDto(id, updateDto);
    const output = await this.updateServiceOrderStatusUseCase.execute(input);
    return ServiceOrderMapper.toResponseDto(output);
  }

  async approveQuote(
    orderNumber: string,
  ): Promise<PublicServiceOrderResponseDto> {
    const input = new FindServiceOrderByOrderNumberInput(orderNumber);
    const output = await this.approveQuoteUseCase.execute(input);
    return ServiceOrderMapper.toPublicResponseDto(output);
  }

  async rejectQuote(
    orderNumber: string,
  ): Promise<PublicServiceOrderResponseDto> {
    const input = new FindServiceOrderByOrderNumberInput(orderNumber);
    const output = await this.rejectQuoteUseCase.execute(input);
    return ServiceOrderMapper.toPublicResponseDto(output);
  }

  async addServiceItem(
    orderId: string,
    dto: AddServiceOrderItemDto,
  ): Promise<ServiceOrderResponseDto> {
    const input = AddServiceItemInput.fromDto(orderId, dto);
    const output = await this.addServiceItemUseCase.execute(input);
    return ServiceOrderMapper.toResponseDto(output);
  }

  async addPartItem(
    orderId: string,
    dto: AddServiceOrderPartDto,
  ): Promise<ServiceOrderResponseDto> {
    const input = AddPartItemInput.fromDto(orderId, dto);
    const output = await this.addPartItemUseCase.execute(input);
    return ServiceOrderMapper.toResponseDto(output);
  }

  async removeServiceItem(
    orderId: string,
    itemId: string,
  ): Promise<ServiceOrderResponseDto> {
    const input = new RemoveServiceItemInput({ orderId, itemId });
    const output = await this.removeServiceItemUseCase.execute(input);
    return ServiceOrderMapper.toResponseDto(output);
  }

  async removePartItem(
    orderId: string,
    itemId: string,
  ): Promise<ServiceOrderResponseDto> {
    const input = new RemovePartItemInput({ orderId, itemId });
    const output = await this.removePartItemUseCase.execute(input);
    return ServiceOrderMapper.toResponseDto(output);
  }

  async getMetrics(orderId: string): Promise<ServiceOrderMetricsResponseDto> {
    const output = await this.getServiceOrderMetricsUseCase.execute({
      orderId,
    });
    return {
      orderId: output.orderId,
      orderNumber: output.orderNumber,
      status: output.status,
      totalTimeMinutes: output.totalTimeMinutes,
      timeByStatus: output.timeByStatus,
      createdAt: output.createdAt,
      startedAt: output.startedAt,
      completedAt: output.completedAt,
      deliveredAt: output.deliveredAt,
    };
  }

  async getGeneralMetrics(): Promise<GeneralMetricsResponseDto> {
    return this.getGeneralMetricsUseCase.execute();
  }
}
