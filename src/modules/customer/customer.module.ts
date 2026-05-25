import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrmEntity } from './infrastructure/entities/customer.orm-entity';
import { CustomerRepository } from './infrastructure/repositories/customer.repository';
import { CustomerService } from './application/services/customer.service';
import { CustomerController } from './interfaces/controllers/customer.controller';
import { CUSTOMER_REPOSITORY } from './domain/repositories/customer.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: CustomerRepository,
    },
  ],
  exports: [CustomerService, CUSTOMER_REPOSITORY],
})
export class CustomerModule {}
