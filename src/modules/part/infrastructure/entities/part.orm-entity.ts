import { Entity, Column } from 'typeorm';
import { BaseOrmEntity } from '@/shared/infrastructure/database/entities';

@Entity('parts')
export class PartOrmEntity extends BaseOrmEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ name: 'reserved_quantity', default: 0 })
  reservedQuantity: number;

  @Column({ name: 'minimum_stock', default: 0 })
  minimumStock: number;

  @Column({ nullable: true })
  manufacturer: string;

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
