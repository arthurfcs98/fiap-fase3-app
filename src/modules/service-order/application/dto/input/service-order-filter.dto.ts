import { IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@/shared/application/dto';
import { ServiceOrderStatus } from '../../../domain/enums/service-order-status.enum';

export class ServiceOrderFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: ServiceOrderStatus,
  })
  @IsOptional()
  @IsEnum(ServiceOrderStatus)
  status?: ServiceOrderStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do cliente',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do veículo',
  })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({
    description: 'Incluir OS finalizadas e entregues (padrão: false)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeFinished?: boolean;
}
