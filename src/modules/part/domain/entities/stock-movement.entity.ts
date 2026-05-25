import { BaseEntity } from '@/shared/domain/base';
import { Part } from './part.entity';
import { StockMovementType } from '../enums/stock-movement-type.enum';

export class StockMovement extends BaseEntity {
  partId: string;
  part?: Part;
  serviceOrderId: string | null;
  movementType: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  previousReserved: number;
  newReserved: number;
  reference?: string;
  notes?: string;
  createdBy: string | null;
}
