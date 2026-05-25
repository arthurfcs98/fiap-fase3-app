import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';

export class ServiceOrderItemResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  serviceId: string;

  @ApiProperty({ example: 'Oil Change' })
  serviceName: string;

  @ApiProperty({ example: 'SRV001' })
  serviceCode: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 150.0 })
  unitPrice: number;

  @ApiProperty({ example: 150.0 })
  subtotal: number;
}

export class ServiceOrderPartResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  partId: string;

  @ApiProperty({ example: 'Oil Filter' })
  partName: string;

  @ApiProperty({ example: 'PRT001' })
  partCode: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 25.5 })
  unitPrice: number;

  @ApiProperty({ example: 51.0 })
  subtotal: number;
}

export class ServiceOrderCustomerResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: '12345678901' })
  document: string;

  @ApiProperty({ example: '11999999999' })
  phone: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;
}

export class ServiceOrderVehicleResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ABC1234' })
  licensePlate: string;

  @ApiProperty({ example: 'Toyota' })
  brand: string;

  @ApiProperty({ example: 'Corolla' })
  model: string;

  @ApiProperty({ example: 2023 })
  year: number;
}

export class ServiceOrderResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'OS-2024-00001' })
  orderNumber: string;

  @ApiProperty({ enum: ServiceOrderStatus })
  status: ServiceOrderStatus;

  @ApiProperty({ example: 'Recebida' })
  statusLabel: string;

  @ApiProperty({ type: ServiceOrderCustomerResponseDto })
  customer: ServiceOrderCustomerResponseDto;

  @ApiProperty({ type: ServiceOrderVehicleResponseDto })
  vehicle: ServiceOrderVehicleResponseDto;

  @ApiProperty({ type: [ServiceOrderItemResponseDto] })
  services: ServiceOrderItemResponseDto[];

  @ApiProperty({ type: [ServiceOrderPartResponseDto] })
  parts: ServiceOrderPartResponseDto[];

  @ApiProperty({ example: 201.0 })
  totalAmount: number;

  @ApiPropertyOptional({
    example: 'Customer reported strange noise when braking',
  })
  observations?: string;

  @ApiPropertyOptional({ example: 'Brake pads worn, needs replacement' })
  diagnosisNotes?: string;

  @ApiPropertyOptional({ example: 45 })
  executionTimeMinutes?: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-01-01T10:00:00Z' })
  startedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T11:30:00Z' })
  completedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T12:00:00Z' })
  deliveredAt?: Date;
}

export class PaginatedServiceOrderResponseDto {
  @ApiProperty({ type: [ServiceOrderResponseDto] })
  data: ServiceOrderResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}

export class ServiceOrderMetricsResponseDto {
  @ApiProperty({ example: 'uuid', description: 'ID da ordem de serviço' })
  orderId: string;

  @ApiProperty({ example: 'OS-2024-00001', description: 'Número da ordem' })
  orderNumber: string;

  @ApiProperty({ enum: ServiceOrderStatus, description: 'Status atual' })
  status: ServiceOrderStatus;

  @ApiPropertyOptional({
    example: 120,
    description: 'Tempo total em minutos (da criação até conclusão)',
  })
  totalTimeMinutes: number | null;

  @ApiProperty({
    example: { RECEIVED: 15, IN_DIAGNOSIS: 30, IN_PROGRESS: 120 },
    description: 'Tempo em minutos gasto em cada status',
  })
  timeByStatus: Record<string, number>;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Data de criação',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    example: '2024-01-01T10:00:00Z',
    description: 'Data de início',
  })
  startedAt: Date | null;

  @ApiPropertyOptional({
    example: '2024-01-01T12:00:00Z',
    description: 'Data de conclusão',
  })
  completedAt: Date | null;

  @ApiPropertyOptional({
    example: '2024-01-01T14:00:00Z',
    description: 'Data de entrega',
  })
  deliveredAt: Date | null;
}

export class GeneralMetricsResponseDto {
  @ApiProperty({ example: 150, description: 'Total de ordens de serviço' })
  totalOrders: number;

  @ApiProperty({
    example: { RECEIVED: 10, IN_PROGRESS: 25, COMPLETED: 100 },
    description: 'Quantidade de ordens por status',
  })
  ordersByStatus: Record<string, number>;

  @ApiPropertyOptional({
    example: 180,
    description: 'Tempo médio de conclusão em minutos',
  })
  averageCompletionTimeMinutes: number | null;

  @ApiProperty({
    example: { RECEIVED: 15, IN_DIAGNOSIS: 45, IN_PROGRESS: 120 },
    description: 'Tempo médio em minutos gasto em cada status',
  })
  averageTimeByStatus: Record<string, number>;

  @ApiProperty({ example: 25000.0, description: 'Receita total (ordens concluídas/entregues)' })
  totalRevenue: number;

  @ApiPropertyOptional({ example: 250.0, description: 'Ticket médio' })
  averageTicket: number | null;

  @ApiProperty({ example: 5, description: 'Ordens criadas hoje' })
  ordersCreatedToday: number;

  @ApiProperty({ example: 3, description: 'Ordens concluídas hoje' })
  ordersCompletedToday: number;
}

export class PublicServiceOrderResponseDto {
  @ApiProperty({ example: 'OS-2024-00001' })
  orderNumber: string;

  @ApiProperty({ enum: ServiceOrderStatus })
  status: ServiceOrderStatus;

  @ApiProperty({ example: 'Em Execução' })
  statusLabel: string;

  @ApiProperty({ example: 'ABC1234' })
  vehiclePlate: string;

  @ApiProperty({ example: 'Toyota Corolla' })
  vehicleDescription: string;

  @ApiProperty({ example: 201.0 })
  totalAmount: number;

  @ApiProperty({ type: [ServiceOrderItemResponseDto] })
  services: ServiceOrderItemResponseDto[];

  @ApiProperty({ type: [ServiceOrderPartResponseDto] })
  parts: ServiceOrderPartResponseDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-01-01T11:30:00Z' })
  estimatedCompletionAt?: Date;
}
