import { Entity, Column } from 'typeorm';
import { BaseOrmEntity } from '@/shared/infrastructure/database/entities';

@Entity('services')
export class ServiceOrmEntity extends BaseOrmEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ name: 'estimated_minutes' })
  estimatedMinutes: number;
}
