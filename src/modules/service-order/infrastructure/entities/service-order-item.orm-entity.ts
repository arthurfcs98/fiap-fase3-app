import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseOrmEntity } from '@/shared/infrastructure/database/entities';
import { ServiceOrderOrmEntity } from './service-order.orm-entity';
import { ServiceOrmEntity } from '@/modules/service/infrastructure/entities/service.orm-entity';

@Entity('service_order_items')
export class ServiceOrderItemOrmEntity extends BaseOrmEntity {
  @Column({ name: 'service_order_id' })
  serviceOrderId: string;

  @ManyToOne(() => ServiceOrderOrmEntity, (order) => order.serviceItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_order_id' })
  serviceOrder: ServiceOrderOrmEntity;

  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => ServiceOrmEntity)
  @JoinColumn({ name: 'service_id' })
  service: ServiceOrmEntity;

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
