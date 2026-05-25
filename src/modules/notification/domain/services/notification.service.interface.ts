export interface StatusChangeNotification {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  vehicleDescription: string;
  previousStatus: string | null;
  newStatus: string;
  newStatusLabel: string;
  customerId: string;
}

export interface INotificationService {
  notifyStatusChange(notification: StatusChangeNotification): Promise<void>;
}

export const NOTIFICATION_SERVICE = Symbol('INotificationService');
