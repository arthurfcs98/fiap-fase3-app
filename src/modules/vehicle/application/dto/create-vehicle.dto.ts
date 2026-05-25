import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({
    example: 'ABC1234',
    description:
      'Vehicle license plate (old format ABC-1234 or Mercosul ABC1D23)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z]{3}[0-9]{4}$|^[A-Za-z]{3}[0-9][A-Za-z][0-9]{2}$/, {
    message: 'License plate must be in format ABC1234 or ABC1D23 (Mercosul)',
  })
  licensePlate: string;

  @ApiProperty({
    example: 'Toyota',
    description: 'Vehicle brand',
  })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({
    example: 'Corolla',
    description: 'Vehicle model',
  })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({
    example: 2023,
    description: 'Vehicle year',
  })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiPropertyOptional({
    example: 'Silver',
    description: 'Vehicle color',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    example: 'uuid',
    description: 'Customer ID',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;
}
