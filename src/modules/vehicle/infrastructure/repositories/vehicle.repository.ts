import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleOrmEntity } from '../entities/vehicle.orm-entity';

@Injectable()
export class VehicleRepository implements IVehicleRepository {
  constructor(
    @InjectRepository(VehicleOrmEntity)
    private readonly repository: Repository<VehicleOrmEntity>,
  ) {}

  async create(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = this.repository.create(vehicleData);
    return this.repository.save(vehicle);
  }

  async findAll(page: number, limit: number): Promise<[Vehicle[], number]> {
    return this.repository.findAndCount({
      relations: ['customer'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Vehicle | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['customer'],
    });
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const cleanPlate = licensePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return this.repository.findOne({
      where: { licensePlate: cleanPlate },
      relations: ['customer'],
    });
  }

  async findByCustomerId(customerId: string): Promise<Vehicle[]> {
    return this.repository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    vehicleData: Partial<Vehicle>,
  ): Promise<Vehicle | null> {
    await this.repository.update(id, vehicleData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
