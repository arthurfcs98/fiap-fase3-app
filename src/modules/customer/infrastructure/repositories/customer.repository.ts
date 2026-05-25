import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../domain/entities/customer.entity';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { CustomerOrmEntity } from '../entities/customer.orm-entity';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repository: Repository<CustomerOrmEntity>,
  ) {}

  async create(customerData: Partial<Customer>): Promise<Customer> {
    const customer = this.repository.create(customerData);
    return this.repository.save(customer);
  }

  async findAll(page: number, limit: number): Promise<[Customer[], number]> {
    return this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['vehicles'],
    });
  }

  async findByDocument(document: string): Promise<Customer | null> {
    const cleanDocument = document.replace(/\D/g, '');
    return this.repository.findOne({
      where: { document: cleanDocument },
      relations: ['vehicles'],
    });
  }

  async update(
    id: string,
    customerData: Partial<Customer>,
  ): Promise<Customer | null> {
    await this.repository.update(id, customerData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
