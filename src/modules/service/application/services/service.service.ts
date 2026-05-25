import { Injectable, Inject } from '@nestjs/common';
import { ServiceErrors } from '@/shared/domain/exceptions/errors';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '../../domain/repositories/service.repository.interface';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
  PaginatedServiceResponseDto,
} from '../dto';
import { Service } from '../../domain/entities/service.entity';

@Injectable()
export class ServiceService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    const code = createServiceDto.code.toUpperCase();

    const existingService = await this.serviceRepository.findByCode(code);

    if (existingService) {
      throw ServiceErrors.CODE_ALREADY_EXISTS(code);
    }

    const service = await this.serviceRepository.create({
      ...createServiceDto,
      code,
    });

    return this.toResponseDto(service);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedServiceResponseDto> {
    const [services, total] = await this.serviceRepository.findAll(page, limit);

    return {
      data: services.map((s) => this.toResponseDto(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findById(id);

    if (!service) {
      throw ServiceErrors.NOT_FOUND(id);
    }

    return this.toResponseDto(service);
  }

  async findByCode(code: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findByCode(code);

    if (!service) {
      throw ServiceErrors.NOT_FOUND(code);
    }

    return this.toResponseDto(service);
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    const existing = await this.serviceRepository.findById(id);

    if (!existing) {
      throw ServiceErrors.NOT_FOUND(id);
    }

    const updateData: Record<string, unknown> = { ...updateServiceDto };

    if (updateServiceDto.code) {
      const code = updateServiceDto.code.toUpperCase();
      const existingWithCode = await this.serviceRepository.findByCode(code);

      if (existingWithCode && existingWithCode.id !== id) {
        throw ServiceErrors.CODE_ALREADY_EXISTS(code);
      }

      updateData.code = code;
    }

    const service = await this.serviceRepository.update(id, updateData);

    if (!service) {
      throw ServiceErrors.NOT_FOUND(id);
    }

    return this.toResponseDto(service);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.serviceRepository.delete(id);

    if (!deleted) {
      throw ServiceErrors.NOT_FOUND(id);
    }
  }

  private toResponseDto(service: Service): ServiceResponseDto {
    return {
      id: service.id,
      code: service.code,
      name: service.name,
      description: service.description,
      basePrice: Number(service.basePrice),
      estimatedMinutes: service.estimatedMinutes,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
