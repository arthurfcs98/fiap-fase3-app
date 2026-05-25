import { ServiceOrderStatus } from '../../../domain/enums/service-order-status.enum';

export class ServiceOrderItemOutput {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class ServiceOrderPartOutput {
  id: string;
  partId: string;
  partName: string;
  partCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class ServiceOrderCustomerOutput {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
}

export class ServiceOrderVehicleOutput {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
}

export class ServiceOrderOutput {
  id: string;
  orderNumber: string;
  status: ServiceOrderStatus;
  statusLabel: string;
  customer: ServiceOrderCustomerOutput;
  vehicle: ServiceOrderVehicleOutput;
  services: ServiceOrderItemOutput[];
  parts: ServiceOrderPartOutput[];
  totalAmount: number;
  observations?: string;
  diagnosisNotes?: string;
  executionTimeMinutes?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;
}

export class PublicServiceOrderOutput {
  orderNumber: string;
  status: ServiceOrderStatus;
  statusLabel: string;
  vehiclePlate: string;
  vehicleDescription: string;
  totalAmount: number;
  services: ServiceOrderItemOutput[];
  parts: ServiceOrderPartOutput[];
  createdAt: Date;
}

export class ServiceOrderMetricsOutput {
  orderId: string;
  orderNumber: string;
  status: ServiceOrderStatus;
  totalTimeMinutes: number | null;
  timeByStatus: Record<string, number>;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  deliveredAt: Date | null;
}

export class GeneralMetricsOutput {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  averageCompletionTimeMinutes: number | null;
  averageTimeByStatus: Record<string, number>;
  totalRevenue: number;
  averageTicket: number | null;
  ordersCreatedToday: number;
  ordersCompletedToday: number;
}
