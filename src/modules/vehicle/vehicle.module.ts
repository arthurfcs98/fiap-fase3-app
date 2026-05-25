import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleOrmEntity } from './infrastructure/entities/vehicle.orm-entity';
import { VehicleRepository } from './infrastructure/repositories/vehicle.repository';
import { VehicleService } from './application/services/vehicle.service';
import { VehicleController } from './interfaces/controllers/vehicle.controller';
import { VEHICLE_REPOSITORY } from './domain/repositories/vehicle.repository.interface';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleOrmEntity]), CustomerModule],
  controllers: [VehicleController],
  providers: [
    VehicleService,
    {
      provide: VEHICLE_REPOSITORY,
      useClass: VehicleRepository,
    },
  ],
  exports: [VehicleService, VEHICLE_REPOSITORY],
})
export class VehicleModule {}
