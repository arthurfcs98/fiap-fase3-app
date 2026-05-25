import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceOrderItemDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Service ID',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Quantity',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class CreateServiceOrderPartDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Part ID',
  })
  @IsUUID()
  @IsNotEmpty()
  partId: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity',
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateServiceOrderDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Customer ID',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    example: 'uuid',
    description: 'Vehicle ID',
  })
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @ApiPropertyOptional({
    type: [CreateServiceOrderItemDto],
    description: 'List of services to include',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceOrderItemDto)
  @IsOptional()
  services?: CreateServiceOrderItemDto[];

  @ApiPropertyOptional({
    type: [CreateServiceOrderPartDto],
    description: 'List of parts to include',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceOrderPartDto)
  @IsOptional()
  parts?: CreateServiceOrderPartDto[];

  @ApiPropertyOptional({
    example: 'Customer reported strange noise when braking',
    description: 'Initial observations',
  })
  @IsString()
  @IsOptional()
  observations?: string;
}
