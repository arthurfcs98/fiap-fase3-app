import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'SRV001' })
  code: string;

  @ApiProperty({ example: 'Oil Change' })
  name: string;

  @ApiPropertyOptional({
    example: 'Complete oil change with filter replacement',
  })
  description?: string;

  @ApiProperty({ example: 150.0 })
  basePrice: number;

  @ApiProperty({ example: 60 })
  estimatedMinutes: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class PaginatedServiceResponseDto {
  @ApiProperty({ type: [ServiceResponseDto] })
  data: ServiceResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
