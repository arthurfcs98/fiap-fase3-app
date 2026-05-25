import { Injectable, Inject } from '@nestjs/common';
import { LicensePlate } from '@/shared/domain/value-objects';
import { VehicleErrors, CustomerErrors } from '@/shared/domain/exceptions/errors';
import {
  IVehicleRepository,
  VEHICLE_REPOSITORY,
} from '../../domain/repositories/vehicle.repository.interface';
import {
  CUSTOMER_REPOSITORY,
  ICustomerRepository,
} from '@/modules/customer/domain/repositories/customer.repository.interface';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
  PaginatedVehicleResponseDto,
} from '../dto';
import { Vehicle } from '../../domain/entities/vehicle.entity';

@Injectable()
export class VehicleService {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async create(
    createVehicleDto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const licensePlate = new LicensePlate(createVehicleDto.licensePlate);

    const customer = await this.customerRepository.findById(
      createVehicleDto.customerId,
    );

    if (!customer) {
      throw CustomerErrors.NOT_FOUND(createVehicleDto.customerId);
    }

    const existingVehicle = await this.vehicleRepository.findByLicensePlate(
      licensePlate.getValue(),
    );

    if (existingVehicle) {
      throw VehicleErrors.PLATE_ALREADY_EXISTS(licensePlate.getValue());
    }

    const vehicle = await this.vehicleRepository.create({
      ...createVehicleDto,
      licensePlate: licensePlate.getValue(),
    });

    return this.toResponseDto(vehicle);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedVehicleResponseDto> {
    const [vehicles, total] = await this.vehicleRepository.findAll(page, limit);

    return {
      data: vehicles.map((v) => this.toResponseDto(v)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) {
      throw VehicleErrors.NOT_FOUND(id);
    }

    return this.toResponseDto(vehicle);
  }

  async findByLicensePlate(licensePlate: string): Promise<VehicleResponseDto> {
    const plate = new LicensePlate(licensePlate);
    const vehicle = await this.vehicleRepository.findByLicensePlate(
      plate.getValue(),
    );

    if (!vehicle) {
      throw VehicleErrors.NOT_FOUND(licensePlate);
    }

    return this.toResponseDto(vehicle);
  }

  async findByCustomerId(customerId: string): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehicleRepository.findByCustomerId(customerId);
    return vehicles.map((v) => this.toResponseDto(v));
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const existing = await this.vehicleRepository.findById(id);

    if (!existing) {
      throw VehicleErrors.NOT_FOUND(id);
    }

    const updateData: Record<string, unknown> = { ...updateVehicleDto };

    if (updateVehicleDto.licensePlate) {
      const licensePlate = new LicensePlate(updateVehicleDto.licensePlate);
      const existingWithPlate = await this.vehicleRepository.findByLicensePlate(
        licensePlate.getValue(),
      );

      if (existingWithPlate && existingWithPlate.id !== id) {
        throw VehicleErrors.PLATE_ALREADY_EXISTS(licensePlate.getValue());
      }

      updateData.licensePlate = licensePlate.getValue();
    }

    const vehicle = await this.vehicleRepository.update(id, updateData);

    if (!vehicle) {
      throw VehicleErrors.NOT_FOUND(id);
    }

    return this.toResponseDto(vehicle);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.vehicleRepository.delete(id);

    if (!deleted) {
      throw VehicleErrors.NOT_FOUND(id);
    }
  }

  private toResponseDto(vehicle: Vehicle): VehicleResponseDto {
    const response: VehicleResponseDto = {
      id: vehicle.id,
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      customerId: vehicle.customerId,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };

    if (vehicle.customer) {
      response.customer = {
        id: vehicle.customer.id,
        name: vehicle.customer.name,
        document: vehicle.customer.document,
      };
    }

    return response;
  }
}
