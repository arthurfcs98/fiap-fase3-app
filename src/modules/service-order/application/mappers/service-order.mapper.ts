import { ServiceOrder } from '../../domain/entities/service-order.entity';
import { getStatusLabel } from '../../domain/enums/service-order-status.enum';
import {
  ServiceOrderOutput,
  PublicServiceOrderOutput,
  ServiceOrderItemOutput,
  ServiceOrderPartOutput,
} from '../dto/output/service-order.output';
import {
  ServiceOrderResponseDto,
  PublicServiceOrderResponseDto,
} from '../dto/service-order-response.dto';

export class ServiceOrderMapper {
  static toOutput(order: ServiceOrder): ServiceOrderOutput {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: getStatusLabel(order.status),
      customer: {
        id: order.customer!.id,
        name: order.customer!.name,
        document: order.customer!.document,
        phone: order.customer!.phone,
        email: order.customer!.email,
      },
      vehicle: {
        id: order.vehicle!.id,
        licensePlate: order.vehicle!.licensePlate,
        brand: order.vehicle!.brand,
        model: order.vehicle!.model,
        year: order.vehicle!.year,
      },
      services: ServiceOrderMapper.mapServiceItems(order),
      parts: ServiceOrderMapper.mapPartItems(order),
      totalAmount: Number(order.totalAmount),
      observations: order.observations ?? undefined,
      diagnosisNotes: order.diagnosisNotes ?? undefined,
      executionTimeMinutes: order.getExecutionTime() ?? undefined,
      createdAt: order.createdAt,
      startedAt: order.startedAt ?? undefined,
      completedAt: order.completedAt ?? undefined,
      deliveredAt: order.deliveredAt ?? undefined,
    };
  }

  static toPublicOutput(order: ServiceOrder): PublicServiceOrderOutput {
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: getStatusLabel(order.status),
      vehiclePlate: order.vehicle!.licensePlate,
      vehicleDescription: `${order.vehicle!.brand} ${order.vehicle!.model}`,
      totalAmount: Number(order.totalAmount),
      services: ServiceOrderMapper.mapServiceItems(order),
      parts: ServiceOrderMapper.mapPartItems(order),
      createdAt: order.createdAt,
    };
  }

  static toResponseDto(output: ServiceOrderOutput): ServiceOrderResponseDto {
    return {
      id: output.id,
      orderNumber: output.orderNumber,
      status: output.status,
      statusLabel: output.statusLabel,
      customer: output.customer,
      vehicle: output.vehicle,
      services: output.services,
      parts: output.parts,
      totalAmount: output.totalAmount,
      observations: output.observations,
      diagnosisNotes: output.diagnosisNotes,
      executionTimeMinutes: output.executionTimeMinutes,
      createdAt: output.createdAt,
      startedAt: output.startedAt,
      completedAt: output.completedAt,
      deliveredAt: output.deliveredAt,
    };
  }

  static toPublicResponseDto(
    output: PublicServiceOrderOutput,
  ): PublicServiceOrderResponseDto {
    return {
      orderNumber: output.orderNumber,
      status: output.status,
      statusLabel: output.statusLabel,
      vehiclePlate: output.vehiclePlate,
      vehicleDescription: output.vehicleDescription,
      totalAmount: output.totalAmount,
      services: output.services,
      parts: output.parts,
      createdAt: output.createdAt,
    };
  }

  private static mapServiceItems(
    order: ServiceOrder,
  ): ServiceOrderItemOutput[] {
    return (order.serviceItems || []).map((item) => ({
      id: item.id,
      serviceId: item.serviceId,
      serviceName: item.service?.name || '',
      serviceCode: item.service?.code || '',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    }));
  }

  private static mapPartItems(order: ServiceOrder): ServiceOrderPartOutput[] {
    return (order.partItems || []).map((item) => ({
      id: item.id,
      partId: item.partId,
      partName: item.part?.name || '',
      partCode: item.part?.code || '',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    }));
  }
}
