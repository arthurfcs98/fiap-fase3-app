import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseOrmEntity } from '@/shared/infrastructure/database/entities';
import { ServiceOrderOrmEntity } from './service-order.orm-entity';
import { PartOrmEntity } from '@/modules/part/infrastructure/entities/part.orm-entity';

@Entity('service_order_parts')
export class ServiceOrderPartOrmEntity extends BaseOrmEntity {
  @Column({ name: 'service_order_id' })
  serviceOrderId: string;

  @ManyToOne(() => ServiceOrderOrmEntity, (order) => order.partItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_order_id' })
  serviceOrder: ServiceOrderOrmEntity;

  @Column({ name: 'part_id' })
  partId: string;

  @ManyToOne(() => PartOrmEntity)
  @JoinColumn({ name: 'part_id' })
  part: PartOrmEntity;

  @Column({ default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  calculateSubtotal(): number {
    return Number(this.unitPrice) * this.quantity;
  }
}
