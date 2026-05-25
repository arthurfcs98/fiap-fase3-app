import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';

export class CreatePartDto {
  @ApiProperty({
    example: 'PRT001',
    description: 'Part code (unique identifier)',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Oil Filter',
    description: 'Part name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'High quality oil filter for Toyota vehicles',
    description: 'Part description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 25.5,
    description: 'Unit price in BRL',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unitPrice: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Initial stock quantity',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Minimum stock level (triggers low stock alert)',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumStock?: number;

  @ApiPropertyOptional({
    example: 'Bosch',
    description: 'Part manufacturer',
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;
}
