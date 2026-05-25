import { Part } from '@/modules/part/domain/entities/part.entity';

export const createMockPart = (overrides: Partial<Part> = {}): Part => {
  const part = new Part();
  part.id = 'part-uuid';
  part.code = 'PRT001';
  part.name = 'Oil Filter';
  part.description = 'High quality oil filter';
  part.unitPrice = 25.5;
  part.stockQuantity = 100;
  part.minimumStock = 10;
  part.manufacturer = 'FilterCo';
  part.createdAt = new Date();
  part.updatedAt = new Date();

  return Object.assign(part, overrides);
};
