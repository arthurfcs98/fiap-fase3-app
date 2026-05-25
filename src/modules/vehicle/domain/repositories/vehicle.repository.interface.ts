import { Vehicle } from '../entities/vehicle.entity';

export interface IVehicleRepository {
  create(vehicle: Partial<Vehicle>): Promise<Vehicle>;
  findAll(page: number, limit: number): Promise<[Vehicle[], number]>;
  findById(id: string): Promise<Vehicle | null>;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  findByCustomerId(customerId: string): Promise<Vehicle[]>;
  update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle | null>;
  delete(id: string): Promise<boolean>;
}

export const VEHICLE_REPOSITORY = Symbol('IVehicleRepository');
