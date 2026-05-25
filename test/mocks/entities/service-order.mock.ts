import { ServiceOrder } from '@/modules/service-order/domain/entities/service-order.entity';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';
import { createMockCustomer } from './customer.mock';
import { createMockVehicle } from './vehicle.mock';

export const createMockServiceOrder = (
  overrides: Partial<ServiceOrder> = {},
): ServiceOrder => {
  const serviceOrder = new ServiceOrder();
  serviceOrder.id = 'order-uuid';
  serviceOrder.orderNumber = 'OS-2024-00001';
  serviceOrder.customerId = 'customer-uuid';
  serviceOrder.vehicleId = 'vehicle-uuid';
  serviceOrder.status = ServiceOrderStatus.RECEIVED;
  serviceOrder.serviceItems = [];
  serviceOrder.partItems = [];
  serviceOrder.totalAmount = 0;
  serviceOrder.observations = undefined;
  serviceOrder.diagnosisNotes = undefined;
  serviceOrder.startedAt = undefined;
  serviceOrder.completedAt = undefined;
  serviceOrder.deliveredAt = undefined;
  serviceOrder.createdAt = new Date();
  serviceOrder.updatedAt = new Date();
  serviceOrder.customer = createMockCustomer();
  serviceOrder.vehicle = createMockVehicle();

  return Object.assign(serviceOrder, overrides);
};
