import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Raw, Repository } from 'typeorm';
import { Part } from '../../domain/entities/part.entity';
import { IPartRepository } from '../../domain/repositories/part.repository.interface';
import { PartOrmEntity } from '../entities/part.orm-entity';

@Injectable()
export class PartRepository implements IPartRepository {
  constructor(
    @InjectRepository(PartOrmEntity)
    private readonly repository: Repository<PartOrmEntity>,
  ) {}

  async create(partData: Partial<Part>): Promise<Part> {
    const part = this.repository.create(partData);
    return this.repository.save(part);
  }

  async findAll(page: number, limit: number): Promise<[Part[], number]> {
    return this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Part | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<Part | null> {
    return this.repository.findOne({
      where: { code: code.toUpperCase() },
    });
  }

  async findByIds(ids: string[]): Promise<Part[]> {
    return this.repository.find({
      where: { id: In(ids) },
    });
  }

  async findLowStock(): Promise<Part[]> {
    return this.repository.find({
      where: {
        stockQuantity: Raw((alias) => `${alias} <= "PartOrmEntity"."minimum_stock"`),
      },
      order: { stockQuantity: 'ASC' },
    });
  }

  async update(id: string, partData: Partial<Part>): Promise<Part | null> {
    await this.repository.update(id, partData);
    return this.findById(id);
  }

  async updateStock(id: string, quantity: number): Promise<Part | null> {
    await this.repository.update(id, { stockQuantity: quantity });
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
