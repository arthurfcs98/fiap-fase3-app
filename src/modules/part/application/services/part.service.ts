import { Injectable, Inject } from "@nestjs/common";
import { PartErrors } from "@/shared/domain/exceptions/errors";
import {
  IPartRepository,
  PART_REPOSITORY,
} from "../../domain/repositories/part.repository.interface";
import {
  CreatePartDto,
  UpdatePartDto,
  UpdateStockDto,
  StockOperationType,
  PartResponseDto,
  PaginatedPartResponseDto,
} from "../dto";
import { Part } from "../../domain/entities/part.entity";

@Injectable()
export class PartService {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly partRepository: IPartRepository,
  ) {}

  async create(createPartDto: CreatePartDto): Promise<PartResponseDto> {
    const code = createPartDto.code.toUpperCase();

    const existingPart = await this.partRepository.findByCode(code);

    if (existingPart) {
      throw PartErrors.CODE_ALREADY_EXISTS(code);
    }

    const part = await this.partRepository.create({
      ...createPartDto,
      code,
      stockQuantity: createPartDto.stockQuantity ?? 0,
      minimumStock: createPartDto.minimumStock ?? 0,
    });

    return this.toResponseDto(part);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedPartResponseDto> {
    const [parts, total] = await this.partRepository.findAll(page, limit);

    return {
      data: parts.map((p) => this.toResponseDto(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PartResponseDto> {
    const part = await this.partRepository.findById(id);

    if (!part) {
      throw PartErrors.NOT_FOUND(id);
    }

    return this.toResponseDto(part);
  }

  async findByCode(code: string): Promise<PartResponseDto> {
    const part = await this.partRepository.findByCode(code);

    if (!part) {
      throw PartErrors.NOT_FOUND(code);
    }

    return this.toResponseDto(part);
  }

  async findLowStock(): Promise<PartResponseDto[]> {
    const parts = await this.partRepository.findLowStock();
    return parts.map((p) => this.toResponseDto(p));
  }

  async update(
    id: string,
    updatePartDto: UpdatePartDto,
  ): Promise<PartResponseDto> {
    const existing = await this.partRepository.findById(id);

    if (!existing) {
      throw PartErrors.NOT_FOUND(id);
    }

    const updateData: Record<string, unknown> = { ...updatePartDto };

    if (updatePartDto.code) {
      const code = updatePartDto.code.toUpperCase();
      const existingWithCode = await this.partRepository.findByCode(code);

      if (existingWithCode && existingWithCode.id !== id) {
        throw PartErrors.CODE_ALREADY_EXISTS(code);
      }

      updateData.code = code;
    }

    const part = await this.partRepository.update(id, updateData);

    if (!part) {
      throw PartErrors.NOT_FOUND(id);
    }

    return this.toResponseDto(part);
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<PartResponseDto> {
    const existing = await this.partRepository.findById(id);

    if (!existing) {
      throw PartErrors.NOT_FOUND(id);
    }

    let newQuantity: number;

    switch (updateStockDto.operation) {
      case StockOperationType.ADD:
        newQuantity = existing.stockQuantity + updateStockDto.quantity;
        break;
      case StockOperationType.REMOVE:
        newQuantity = existing.stockQuantity - updateStockDto.quantity;
        if (newQuantity < 0) {
          throw PartErrors.INSUFFICIENT_STOCK(id);
        }
        break;
      case StockOperationType.SET:
        if (updateStockDto.quantity < 0) {
          throw PartErrors.NEGATIVE_STOCK();
        }
        newQuantity = updateStockDto.quantity;
        break;
    }

    const part = await this.partRepository.updateStock(id, newQuantity);

    if (!part) {
      throw PartErrors.NOT_FOUND(id);
    }

    return this.toResponseDto(part);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.partRepository.delete(id);

    if (!deleted) {
      throw PartErrors.NOT_FOUND(id);
    }
  }

  private toResponseDto(part: Part): PartResponseDto {
    return {
      id: part.id,
      code: part.code,
      name: part.name,
      description: part.description,
      unitPrice: Number(part.unitPrice),
      stockQuantity: part.stockQuantity,
      minimumStock: part.minimumStock,
      manufacturer: part.manufacturer,
      isLowStock: part.isLowStock(),
      createdAt: part.createdAt,
      updatedAt: part.updatedAt,
    };
  }
}
