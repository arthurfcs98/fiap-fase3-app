import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrderOrmEntity } from './infrastructure/entities/service-order.orm-entity';
import { ServiceOrderItemOrmEntity } from './infrastructure/entities/service-order-item.orm-entity';
import { ServiceOrderPartOrmEntity } from './infrastructure/entities/service-order-part.orm-entity';
import { ServiceOrderStatusHistoryOrmEntity } from './infrastructure/entities/service-order-status-history.orm-entity';
import { ServiceOrderRepository } from './infrastructure/repositories/service-order.repository';
import { ServiceOrderStatusHistoryRepository } from './infrastructure/repositories/service-order-status-history.repository';
import { ServiceOrderItemRepository } from './infrastructure/repositories/service-order-item.repository';
import { ServiceOrderPartRepository } from './infrastructure/repositories/service-order-part.repository';
import { ServiceOrderService } from './application/services/service-order.service';
import { ServiceOrderAdminController } from './interfaces/controllers/service-order-admin.controller';
import { ServiceOrderPublicController } from './interfaces/controllers/service-order-public.controller';
import { SERVICE_ORDER_REPOSITORY } from './domain/repositories/service-order.repository.interface';
import { SERVICE_ORDER_STATUS_HISTORY_REPOSITORY } from './domain/repositories/service-order-status-history.repository.interface';
import { SERVICE_ORDER_ITEM_REPOSITORY } from './domain/repositories/service-order-item.repository.interface';
import { SERVICE_ORDER_PART_REPOSITORY } from './domain/repositories/service-order-part.repository.interface';
import { CustomerModule } from '../customer/customer.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { ServiceModule } from '../service/service.module';
import { PartModule } from '../part/part.module';
import { NotificationModule } from '../notification/notification.module';

// Use Cases
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
} from './application/use-cases';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceOrderOrmEntity,
      ServiceOrderItemOrmEntity,
      ServiceOrderPartOrmEntity,
      ServiceOrderStatusHistoryOrmEntity,
    ]),
    CustomerModule,
    VehicleModule,
    ServiceModule,
    PartModule,
    NotificationModule,
  ],
  controllers: [ServiceOrderAdminController, ServiceOrderPublicController],
  providers: [
    // Use Cases
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

    // Facade Service (backward compatibility)
    ServiceOrderService,

    // Repositories
    {
      provide: SERVICE_ORDER_REPOSITORY,
      useClass: ServiceOrderRepository,
    },
    {
      provide: SERVICE_ORDER_STATUS_HISTORY_REPOSITORY,
      useClass: ServiceOrderStatusHistoryRepository,
    },
    {
      provide: SERVICE_ORDER_ITEM_REPOSITORY,
      useClass: ServiceOrderItemRepository,
    },
    {
      provide: SERVICE_ORDER_PART_REPOSITORY,
      useClass: ServiceOrderPartRepository,
    },
  ],
  exports: [
    ServiceOrderService,
    // Export use cases for direct usage
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
  ],
})
export class ServiceOrderModule {}
