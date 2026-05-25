import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: '12345678901' })
  document: string;

  @ApiProperty({ example: 'CPF', enum: ['CPF', 'CNPJ'] })
  documentType: 'CPF' | 'CNPJ';

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '11999999999' })
  phone: string;

  @ApiPropertyOptional({ example: 'Main Street' })
  street?: string;

  @ApiPropertyOptional({ example: '123' })
  number?: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  complement?: string;

  @ApiPropertyOptional({ example: 'Downtown' })
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  state?: string;

  @ApiPropertyOptional({ example: '01310100' })
  zipCode?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class PaginatedCustomerResponseDto {
  @ApiProperty({ type: [CustomerResponseDto] })
  data: CustomerResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
