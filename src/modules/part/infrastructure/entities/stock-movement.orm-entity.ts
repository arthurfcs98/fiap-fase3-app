import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseOrmEntity } from '@/shared/infrastructure/database/entities';
import { PartOrmEntity } from './part.orm-entity';
import { StockMovementType } from '../../domain/enums/stock-movement-type.enum';

@Entity('stock_movements')
export class StockMovementOrmEntity extends BaseOrmEntity {
  @Column({ name: 'part_id' })
  partId: string;

  @ManyToOne(() => PartOrmEntity)
  @JoinColumn({ name: 'part_id' })
  part: PartOrmEntity;

  @Column({ name: 'service_order_id', type: 'uuid', nullable: true })
  serviceOrderId: string | null;

  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: StockMovementType,
  })
  movementType: StockMovementType;

  @Column()
  quantity: number;

  @Column({ name: 'previous_stock' })
  previousStock: number;

  @Column({ name: 'new_stock' })
  newStock: number;

  @Column({ name: 'previous_reserved', default: 0 })
  previousReserved: number;

  @Column({ name: 'new_reserved', default: 0 })
  newReserved: number;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;
}
