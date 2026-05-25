import { Entity, Column, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '@/shared/infrastructure/database/entities';
import { VehicleOrmEntity } from '@/modules/vehicle/infrastructure/entities/vehicle.orm-entity';

@Entity('customers')
export class CustomerOrmEntity extends BaseOrmEntity {
  @Column({ name: 'document', unique: true })
  document: string;

  @Column({ name: 'document_type' })
  documentType: 'CPF' | 'CNPJ';

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  number: string;

  @Column({ nullable: true })
  complement: string;

  @Column({ nullable: true })
  neighborhood: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ name: 'zip_code', nullable: true })
  zipCode: string;

  @OneToMany(() => VehicleOrmEntity, (vehicle) => vehicle.customer)
  vehicles: VehicleOrmEntity[];
}
