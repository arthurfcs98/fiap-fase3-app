import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrmEntity } from './infrastructure/entities/service.orm-entity';
import { ServiceRepository } from './infrastructure/repositories/service.repository';
import { ServiceService } from './application/services/service.service';
import { ServiceController } from './interfaces/controllers/service.controller';
import { SERVICE_REPOSITORY } from './domain/repositories/service.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrmEntity])],
  controllers: [ServiceController],
  providers: [
    ServiceService,
    {
      provide: SERVICE_REPOSITORY,
      useClass: ServiceRepository,
    },
  ],
  exports: [ServiceService, SERVICE_REPOSITORY],
})
export class ServiceModule {}
