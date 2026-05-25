import { StockMovement } from '../entities/stock-movement.entity';

export interface IStockService {
  reserveStock(partId: string, quantity: number, serviceOrderId: string, notes?: string): Promise<void>;
  releaseStock(partId: string, quantity: number, serviceOrderId: string, notes?: string): Promise<void>;
  confirmStockDeduction(serviceOrderId: string): Promise<void>;
  releaseAllReservedStock(serviceOrderId: string): Promise<void>;
  getMovementsByPart(partId: string): Promise<StockMovement[]>;
  getMovementsByServiceOrder(serviceOrderId: string): Promise<StockMovement[]>;
}

export const STOCK_SERVICE = Symbol('IStockService');
