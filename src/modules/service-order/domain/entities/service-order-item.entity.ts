import { BaseEntity } from '@/shared/domain/base';
import { Service } from '@/modules/service/domain/entities/service.entity';

export class ServiceOrderItem extends BaseEntity {
  serviceOrderId: string;
  serviceOrder?: any;
  serviceId: string;
  service?: Service;
  quantity: number;
  unitPrice: number;
  subtotal: number;

  calculateSubtotal(): number {
    return Number(this.unitPrice) * this.quantity;
  }
}
