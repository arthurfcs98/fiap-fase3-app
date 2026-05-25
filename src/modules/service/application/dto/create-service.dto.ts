import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'SRV001',
    description: 'Service code (unique identifier)',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Oil Change',
    description: 'Service name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Complete oil change with filter replacement',
    description: 'Service description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 150.0,
    description: 'Base price in BRL',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice: number;

  @ApiProperty({
    example: 60,
    description: 'Estimated time in minutes',
  })
  @IsNumber()
  @Min(1)
  estimatedMinutes: number;
}
