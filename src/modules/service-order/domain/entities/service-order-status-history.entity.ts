import { BaseEntity } from '@/shared/domain/base';
import { ServiceOrderStatus } from '../enums/service-order-status.enum';

export class ServiceOrderStatusHistory extends BaseEntity {
  serviceOrderId: string;
  serviceOrder?: any;
  fromStatus: ServiceOrderStatus | null;
  toStatus: ServiceOrderStatus;
  changedAt: Date;
  changedBy: string | null;
  notes: string | null;

  getDurationFromPrevious(previousHistory: ServiceOrderStatusHistory | null): number | null {
    if (!previousHistory) {
      return null;
    }
    return Math.round(
      (this.changedAt.getTime() - previousHistory.changedAt.getTime()) / (1000 * 60),
    );
  }
}
