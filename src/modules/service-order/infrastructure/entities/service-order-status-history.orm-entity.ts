import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BaseOrmEntity } from '@/shared/infrastructure/database/entities';
import { ServiceOrderOrmEntity } from './service-order.orm-entity';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';

@Entity('service_order_status_history')
export class ServiceOrderStatusHistoryOrmEntity extends BaseOrmEntity {
  @Column({ name: 'service_order_id' })
  serviceOrderId: string;

  @ManyToOne(() => ServiceOrderOrmEntity)
  @JoinColumn({ name: 'service_order_id' })
  serviceOrder: ServiceOrderOrmEntity;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: ServiceOrderStatus,
    nullable: true,
  })
  fromStatus: ServiceOrderStatus | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: ServiceOrderStatus,
  })
  toStatus: ServiceOrderStatus;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  getDurationFromPrevious(previousHistory: ServiceOrderStatusHistoryOrmEntity | null): number | null {
    if (!previousHistory) {
      return null;
    }
    return Math.round(
      (this.changedAt.getTime() - previousHistory.changedAt.getTime()) / (1000 * 60),
    );
  }
}
