import { Part } from '../entities/part.entity';

export interface IPartRepository {
  create(part: Partial<Part>): Promise<Part>;
  findAll(page: number, limit: number): Promise<[Part[], number]>;
  findById(id: string): Promise<Part | null>;
  findByCode(code: string): Promise<Part | null>;
  findByIds(ids: string[]): Promise<Part[]>;
  findLowStock(): Promise<Part[]>;
  update(id: string, part: Partial<Part>): Promise<Part | null>;
  updateStock(id: string, quantity: number): Promise<Part | null>;
  delete(id: string): Promise<boolean>;
}

export const PART_REPOSITORY = Symbol('IPartRepository');
