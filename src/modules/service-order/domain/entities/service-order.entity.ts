import { BaseEntity } from '@/shared/domain/base';
import { Customer } from '@/modules/customer/domain/entities/customer.entity';
import { Vehicle } from '@/modules/vehicle/domain/entities/vehicle.entity';
import { ServiceOrderStatus } from '../enums/service-order-status.enum';
import { ServiceOrderItem } from './service-order-item.entity';
import { ServiceOrderPart } from './service-order-part.entity';

export class ServiceOrder extends BaseEntity {
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  vehicleId: string;
  vehicle?: Vehicle;
  status: ServiceOrderStatus;
  serviceItems?: ServiceOrderItem[];
  partItems?: ServiceOrderPart[];
  totalAmount: number;
  observations?: string;
  diagnosisNotes?: string;
  startedAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;

  calculateTotal(): number {
    const servicesTotal = (this.serviceItems || []).reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    const partsTotal = (this.partItems || []).reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    return servicesTotal + partsTotal;
  }

  getExecutionTime(): number | null {
    if (!this.startedAt || !this.completedAt) {
      return null;
    }
    return Math.round(
      (this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60),
    );
  }
}
