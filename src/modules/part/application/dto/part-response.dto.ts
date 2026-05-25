import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'PRT001' })
  code: string;

  @ApiProperty({ example: 'Oil Filter' })
  name: string;

  @ApiPropertyOptional({
    example: 'High quality oil filter for Toyota vehicles',
  })
  description?: string;

  @ApiProperty({ example: 25.5 })
  unitPrice: number;

  @ApiProperty({ example: 100 })
  stockQuantity: number;

  @ApiProperty({ example: 10 })
  minimumStock: number;

  @ApiPropertyOptional({ example: 'Bosch' })
  manufacturer?: string;

  @ApiProperty({ example: false })
  isLowStock: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class PaginatedPartResponseDto {
  @ApiProperty({ type: [PartResponseDto] })
  data: PartResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
