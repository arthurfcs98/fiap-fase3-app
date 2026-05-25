import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';

export class UpdateServiceOrderStatusDto {
  @ApiProperty({
    enum: ServiceOrderStatus,
    example: ServiceOrderStatus.IN_DIAGNOSIS,
    description: 'New status for the service order',
  })
  @IsEnum(ServiceOrderStatus)
  @IsNotEmpty()
  status: ServiceOrderStatus;

  @ApiPropertyOptional({
    example: 'Brake pads worn, needs replacement',
    description: 'Notes about the status change (e.g., diagnosis notes)',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
