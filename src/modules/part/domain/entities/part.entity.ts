import { BaseEntity } from '@/shared/domain/base';

export class Part extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  unitPrice: number;
  stockQuantity: number;
  reservedQuantity: number;
  minimumStock: number;
  manufacturer?: string;

  isLowStock(): boolean {
    return this.getAvailableStock() <= this.minimumStock;
  }

  hasStock(quantity: number): boolean {
    return this.stockQuantity >= quantity;
  }

  getAvailableStock(): number {
    return this.stockQuantity - this.reservedQuantity;
  }

  hasAvailableStock(quantity: number): boolean {
    return this.getAvailableStock() >= quantity;
  }
}
