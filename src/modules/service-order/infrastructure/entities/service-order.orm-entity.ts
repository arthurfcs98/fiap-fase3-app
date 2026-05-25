import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '@/shared/infrastructure/database/entities';
import { CustomerOrmEntity } from '@/modules/customer/infrastructure/entities/customer.orm-entity';
import { VehicleOrmEntity } from '@/modules/vehicle/infrastructure/entities/vehicle.orm-entity';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';
import { ServiceOrderItemOrmEntity } from './service-order-item.orm-entity';
import { ServiceOrderPartOrmEntity } from './service-order-part.orm-entity';

@Entity('service_orders')
export class ServiceOrderOrmEntity extends BaseOrmEntity {
  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => CustomerOrmEntity)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => VehicleOrmEntity, (vehicle) => vehicle.serviceOrders)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleOrmEntity;

  @Column({
    type: 'enum',
    enum: ServiceOrderStatus,
    default: ServiceOrderStatus.RECEIVED,
  })
  status: ServiceOrderStatus;

  @OneToMany(() => ServiceOrderItemOrmEntity, (item) => item.serviceOrder, {
    cascade: true,
    eager: true,
  })
  serviceItems: ServiceOrderItemOrmEntity[];

  @OneToMany(() => ServiceOrderPartOrmEntity, (part) => part.serviceOrder, {
    cascade: true,
    eager: true,
  })
  partItems: ServiceOrderPartOrmEntity[];

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ name: 'diagnosis_notes', type: 'text', nullable: true })
  diagnosisNotes: string;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  calculateTotal(): number {
    const servicesTotal = (this.serviceItems || []).reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    const partsTotal = (this.partItems || []).reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    return servicesTotal + partsTotal;
  }

  getExecutionTime(): number | null {
    if (!this.startedAt || !this.completedAt) {
      return null;
    }
    return Math.round(
      (this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60),
    );
  }
}
