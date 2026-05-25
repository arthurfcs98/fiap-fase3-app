import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VehicleOwnerDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: '12345678901' })
  document: string;
}

export class VehicleResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ABC1234' })
  licensePlate: string;

  @ApiProperty({ example: 'Toyota' })
  brand: string;

  @ApiProperty({ example: 'Corolla' })
  model: string;

  @ApiProperty({ example: 2023 })
  year: number;

  @ApiPropertyOptional({ example: 'Silver' })
  color?: string;

  @ApiProperty({ example: 'uuid' })
  customerId: string;

  @ApiPropertyOptional({ type: VehicleOwnerDto })
  customer?: VehicleOwnerDto;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class PaginatedVehicleResponseDto {
  @ApiProperty({ type: [VehicleResponseDto] })
  data: VehicleResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
