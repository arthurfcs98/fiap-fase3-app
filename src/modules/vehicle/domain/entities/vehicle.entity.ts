import { BaseEntity } from '@/shared/domain/base';
import { Customer } from '@/modules/customer/domain/entities/customer.entity';

export class Vehicle extends BaseEntity {
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  customerId: string;
  customer?: Customer;
  serviceOrders?: any[];
}
