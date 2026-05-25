import { Customer } from '@/modules/customer/domain/entities/customer.entity';

export const createMockCustomer = (
  overrides: Partial<Customer> = {},
): Customer => {
  const customer = new Customer();
  customer.id = 'customer-uuid';
  customer.document = '12345678901';
  customer.documentType = 'CPF';
  customer.name = 'John Doe';
  customer.email = 'john@example.com';
  customer.phone = '11999999999';
  customer.street = 'Main Street';
  customer.number = '123';
  customer.complement = 'Apt 1';
  customer.neighborhood = 'Downtown';
  customer.city = 'Sao Paulo';
  customer.state = 'SP';
  customer.zipCode = '01234567';
  customer.createdAt = new Date();
  customer.updatedAt = new Date();
  customer.vehicles = [];

  return Object.assign(customer, overrides);
};
