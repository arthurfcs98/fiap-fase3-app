import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '@/shared/infrastructure/database/entities';
import { CustomerOrmEntity } from '@/modules/customer/infrastructure/entities/customer.orm-entity';
import { ServiceOrderOrmEntity } from '@/modules/service-order/infrastructure/entities/service-order.orm-entity';

@Entity('vehicles')
export class VehicleOrmEntity extends BaseOrmEntity {
  @Column({ name: 'license_plate', unique: true })
  licensePlate: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column({ nullable: true })
  color: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => CustomerOrmEntity, (customer) => customer.vehicles)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity;

  @OneToMany(() => ServiceOrderOrmEntity, (serviceOrder) => serviceOrder.vehicle)
  serviceOrders: ServiceOrderOrmEntity[];
}
