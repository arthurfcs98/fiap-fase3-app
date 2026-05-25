import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartOrmEntity } from './infrastructure/entities/part.orm-entity';
import { StockMovementOrmEntity } from './infrastructure/entities/stock-movement.orm-entity';
import { PartRepository } from './infrastructure/repositories/part.repository';
import { PartService } from './application/services/part.service';
import { StockService } from './infrastructure/services/stock.service';
import { STOCK_SERVICE } from './domain/services/stock.service.interface';
import { PartController } from './interfaces/controllers/part.controller';
import { PART_REPOSITORY } from './domain/repositories/part.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([PartOrmEntity, StockMovementOrmEntity])],
  controllers: [PartController],
  providers: [
    PartService,
    {
      provide: STOCK_SERVICE,
      useClass: StockService,
    },
    {
      provide: PART_REPOSITORY,
      useClass: PartRepository,
    },
  ],
  exports: [PartService, STOCK_SERVICE, PART_REPOSITORY],
})
export class PartModule {}
