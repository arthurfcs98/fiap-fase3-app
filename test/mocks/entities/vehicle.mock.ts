import { Vehicle } from '@/modules/vehicle/domain/entities/vehicle.entity';

export const createMockVehicle = (
  overrides: Partial<Vehicle> = {},
): Vehicle => {
  const vehicle = new Vehicle();
  vehicle.id = 'vehicle-uuid';
  vehicle.licensePlate = 'ABC1234';
  vehicle.brand = 'Toyota';
  vehicle.model = 'Corolla';
  vehicle.year = 2023;
  vehicle.color = 'Black';
  vehicle.customerId = 'customer-uuid';
  vehicle.createdAt = new Date();
  vehicle.updatedAt = new Date();

  return Object.assign(vehicle, overrides);
};
