import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';

export enum StockOperationType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  SET = 'SET',
}

export class UpdateStockDto {
  @ApiProperty({
    example: 10,
    description: 'Quantity to add, remove, or set',
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    example: 'ADD',
    enum: StockOperationType,
    description:
      'Operation type: ADD (increase), REMOVE (decrease), or SET (absolute value)',
  })
  @IsEnum(StockOperationType)
  @IsNotEmpty()
  operation: StockOperationType;
}
