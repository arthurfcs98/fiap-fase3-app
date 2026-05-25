import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class AddServiceOrderItemDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Service ID to add',
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
  quantity?: number;
}

export class AddServiceOrderPartDto {
  @ApiProperty({
    example: 'uuid',
    description: 'Part ID to add',
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
