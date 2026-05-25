import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application';
import { CustomerErrors, VehicleErrors, ServiceErrors, PartErrors } from '@/shared/domain/exceptions/errors';
import {
  ICustomerRepository,
  CUSTOMER_REPOSITORY,
} from '@/modules/customer/domain/repositories/customer.repository.interface';
import {
  IVehicleRepository,
  VEHICLE_REPOSITORY,
} from '@/modules/vehicle/domain/repositories/vehicle.repository.interface';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '@/modules/service/domain/repositories/service.repository.interface';
import {
  IPartRepository,
  PART_REPOSITORY,
} from '@/modules/part/domain/repositories/part.repository.interface';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import {
  IServiceOrderStatusHistoryRepository,
  SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
} from '../../../domain/repositories/service-order-status-history.repository.interface';
import {
  IServiceOrderItemRepository,
  SERVICE_ORDER_ITEM_REPOSITORY,
} from '../../../domain/repositories/service-order-item.repository.interface';
import {
  IServiceOrderPartRepository,
  SERVICE_ORDER_PART_REPOSITORY,
} from '../../../domain/repositories/service-order-part.repository.interface';
import { ServiceOrderStatus } from '../../../domain/enums/service-order-status.enum';
import { CreateServiceOrderInput } from '../../dto/input/create-service-order.input';
import { ServiceOrderOutput } from '../../dto/output/service-order.output';
import { ServiceOrderMapper } from '../../mappers/service-order.mapper';

@Injectable()
export class CreateServiceOrderUseCase
  implements IUseCase<CreateServiceOrderInput, ServiceOrderOutput>
{
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly serviceOrderRepository: IServiceOrderRepository,
    @Inject(SERVICE_ORDER_STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: IServiceOrderStatusHistoryRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    @Inject(PART_REPOSITORY)
    private readonly partRepository: IPartRepository,
    @Inject(SERVICE_ORDER_ITEM_REPOSITORY)
    private readonly serviceItemRepository: IServiceOrderItemRepository,
    @Inject(SERVICE_ORDER_PART_REPOSITORY)
    private readonly partItemRepository: IServiceOrderPartRepository,
  ) {}

  async execute(input: CreateServiceOrderInput): Promise<ServiceOrderOutput> {
    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) {
      throw CustomerErrors.NOT_FOUND(input.customerId);
    }

    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle) {
      throw VehicleErrors.NOT_FOUND(input.vehicleId);
    }

    if (vehicle.customerId !== customer.id) {
      throw VehicleErrors.NOT_OWNED_BY_CUSTOMER(input.vehicleId, input.customerId);
    }

    const orderNumber = await this.serviceOrderRepository.getNextOrderNumber();

    const serviceOrder = await this.serviceOrderRepository.create({
      orderNumber,
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      status: ServiceOrderStatus.RECEIVED,
      observations: input.observations,
      totalAmount: 0,
    });

    // Record initial status in history
    await this.statusHistoryRepository.create({
      serviceOrderId: serviceOrder.id,
      fromStatus: null,
      toStatus: ServiceOrderStatus.RECEIVED,
      changedAt: new Date(),
      notes: 'Ordem de serviço criada',
    });

    for (const serviceInput of input.services) {
      await this.addServiceItem(serviceOrder.id, serviceInput);
    }

    for (const partInput of input.parts) {
      await this.addPartItem(serviceOrder.id, partInput);
    }

    await this.serviceOrderRepository.recalculateTotal(serviceOrder.id);

    const completeOrder = await this.serviceOrderRepository.findById(
      serviceOrder.id,
    );

    return ServiceOrderMapper.toOutput(completeOrder!);
  }

  private async addServiceItem(
    orderId: string,
    serviceInput: { serviceId: string; quantity: number },
  ): Promise<void> {
    const service = await this.serviceRepository.findById(
      serviceInput.serviceId,
    );
    if (!service) {
      throw ServiceErrors.NOT_FOUND(serviceInput.serviceId);
    }

    const subtotal = Number(service.basePrice) * serviceInput.quantity;

    const item = this.serviceItemRepository.create({
      serviceOrderId: orderId,
      serviceId: serviceInput.serviceId,
      quantity: serviceInput.quantity,
      unitPrice: service.basePrice,
      subtotal,
    });

    await this.serviceItemRepository.save(item);
  }

  private async addPartItem(
    orderId: string,
    partInput: { partId: string; quantity: number },
  ): Promise<void> {
    const part = await this.partRepository.findById(partInput.partId);
    if (!part) {
      throw PartErrors.NOT_FOUND(partInput.partId);
    }

    if (!part.hasStock(partInput.quantity)) {
      throw PartErrors.INSUFFICIENT_STOCK(partInput.partId);
    }

    const subtotal = Number(part.unitPrice) * partInput.quantity;

    const item = this.partItemRepository.create({
      serviceOrderId: orderId,
      partId: partInput.partId,
      quantity: partInput.quantity,
      unitPrice: part.unitPrice,
      subtotal,
    });

    await this.partItemRepository.save(item);
  }

}
