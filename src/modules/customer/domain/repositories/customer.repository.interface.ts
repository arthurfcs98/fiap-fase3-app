import { Customer } from '../entities/customer.entity';

export interface ICustomerRepository {
  create(customer: Partial<Customer>): Promise<Customer>;
  findAll(page: number, limit: number): Promise<[Customer[], number]>;
  findById(id: string): Promise<Customer | null>;
  findByDocument(document: string): Promise<Customer | null>;
  update(id: string, customer: Partial<Customer>): Promise<Customer | null>;
  delete(id: string): Promise<boolean>;
}

export const CUSTOMER_REPOSITORY = Symbol('ICustomerRepository');
