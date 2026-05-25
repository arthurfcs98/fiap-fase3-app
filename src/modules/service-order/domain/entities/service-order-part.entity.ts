import { BaseEntity } from '@/shared/domain/base';
import { Part } from '@/modules/part/domain/entities/part.entity';

export class ServiceOrderPart extends BaseEntity {
  serviceOrderId: string;
  serviceOrder?: any;
  partId: string;
  part?: Part;
  quantity: number;
  unitPrice: number;
  subtotal: number;

  calculateSubtotal(): number {
    return Number(this.unitPrice) * this.quantity;
  }
}
