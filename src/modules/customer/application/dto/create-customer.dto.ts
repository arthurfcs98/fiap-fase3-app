import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    example: '12345678901',
    description: 'CPF (11 digits) or CNPJ (14 digits)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(\d{11}|\d{14}|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/,
    {
      message: 'Document must be a valid CPF or CNPJ',
    },
  )
  document: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Customer full name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Customer email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '11999999999',
    description: 'Customer phone number',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({
    example: 'Main Street',
    description: 'Street name',
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({
    example: '123',
    description: 'Street number',
  })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({
    example: 'Apt 4B',
    description: 'Address complement',
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiPropertyOptional({
    example: 'Downtown',
    description: 'Neighborhood',
  })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiPropertyOptional({
    example: 'São Paulo',
    description: 'City',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'SP',
    description: 'State (2 letter code)',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    example: '01310100',
    description: 'ZIP code',
  })
  @IsString()
  @IsOptional()
  zipCode?: string;
}
