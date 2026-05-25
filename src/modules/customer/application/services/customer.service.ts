import { Injectable, Inject } from '@nestjs/common';
import { Document, DocumentType } from '@/shared/domain/value-objects';
import { CustomerErrors } from '@/shared/domain/exceptions/errors';
import { Customer } from '../../domain/entities/customer.entity';
import {
  ICustomerRepository,
  CUSTOMER_REPOSITORY,
} from '../../domain/repositories/customer.repository.interface';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  PaginatedCustomerResponseDto,
} from '../dto';

@Injectable()
export class CustomerService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const document = new Document(createCustomerDto.document);

    const existingCustomer = await this.customerRepository.findByDocument(
      document.getValue(),
    );

    if (existingCustomer) {
      throw CustomerErrors.ALREADY_EXISTS(document.getValue());
    }

    const customer = await this.customerRepository.create({
      ...createCustomerDto,
      document: document.getValue(),
      documentType: document.getType() as 'CPF' | 'CNPJ',
    });

    return this.toResponseDto(customer);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedCustomerResponseDto> {
    const [customers, total] = await this.customerRepository.findAll(
      page,
      limit,
    );

    return {
      data: customers.map((c) => this.toResponseDto(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw CustomerErrors.NOT_FOUND(id);
    }

    return this.toResponseDto(customer);
  }

  async findByDocument(document: string): Promise<CustomerResponseDto> {
    const doc = new Document(document);
    const customer = await this.customerRepository.findByDocument(
      doc.getValue(),
    );

    if (!customer) {
      throw CustomerErrors.NOT_FOUND(document);
    }

    return this.toResponseDto(customer);
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const existing = await this.customerRepository.findById(id);

    if (!existing) {
      throw CustomerErrors.NOT_FOUND(id);
    }

    const updateData: Record<string, unknown> = { ...updateCustomerDto };

    if (updateCustomerDto.document) {
      const document = new Document(updateCustomerDto.document);
      const existingWithDocument = await this.customerRepository.findByDocument(
        document.getValue(),
      );

      if (existingWithDocument && existingWithDocument.id !== id) {
        throw CustomerErrors.ALREADY_EXISTS(document.getValue());
      }

      updateData.document = document.getValue();
      updateData.documentType = document.getType();
    }

    const customer = await this.customerRepository.update(id, updateData);

    if (!customer) {
      throw CustomerErrors.NOT_FOUND(id);
    }

    return this.toResponseDto(customer);
  }

  async delete(id: string): Promise<void> {
    await this.customerRepository.delete(id);
  }

  private toResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      document: customer.document,
      documentType: customer.documentType as DocumentType,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      street: customer.street,
      number: customer.number,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
