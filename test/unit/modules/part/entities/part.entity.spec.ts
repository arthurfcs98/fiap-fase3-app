import { Part } from '@/modules/part/domain/entities/part.entity';

describe('Part Entity', () => {
  const createPart = (overrides: Partial<Part> = {}): Part => {
    const part = new Part();
    part.id = 'part-uuid';
    part.code = 'PRT001';
    part.name = 'Oil Filter';
    part.stockQuantity = 100;
    part.reservedQuantity = 0;
    part.minimumStock = 10;
    part.unitPrice = 25.5;
    return Object.assign(part, overrides);
  };

  describe('getAvailableStock', () => {
    it('should return stockQuantity minus reservedQuantity', () => {
      const part = createPart({ stockQuantity: 100, reservedQuantity: 30 });

      expect(part.getAvailableStock()).toBe(70);
    });

    it('should return full stockQuantity when no reservations', () => {
      const part = createPart({ stockQuantity: 100, reservedQuantity: 0 });

      expect(part.getAvailableStock()).toBe(100);
    });

    it('should return zero when all stock is reserved', () => {
      const part = createPart({ stockQuantity: 50, reservedQuantity: 50 });

      expect(part.getAvailableStock()).toBe(0);
    });

    it('should handle negative available (over-reserved scenario)', () => {
      const part = createPart({ stockQuantity: 30, reservedQuantity: 50 });

      expect(part.getAvailableStock()).toBe(-20);
    });
  });

  describe('hasAvailableStock', () => {
    it('should return true when available stock is sufficient', () => {
      const part = createPart({ stockQuantity: 100, reservedQuantity: 30 });

      expect(part.hasAvailableStock(50)).toBe(true);
    });

    it('should return true when requesting exact available amount', () => {
      const part = createPart({ stockQuantity: 100, reservedQuantity: 30 });

      expect(part.hasAvailableStock(70)).toBe(true);
    });

    it('should return false when available stock is insufficient', () => {
      const part = createPart({ stockQuantity: 100, reservedQuantity: 30 });

      expect(part.hasAvailableStock(80)).toBe(false);
    });

    it('should return false when all stock is reserved', () => {
      const part = createPart({ stockQuantity: 50, reservedQuantity: 50 });

      expect(part.hasAvailableStock(1)).toBe(false);
    });

    it('should return true for zero quantity request', () => {
      const part = createPart({ stockQuantity: 0, reservedQuantity: 0 });

      expect(part.hasAvailableStock(0)).toBe(true);
    });
  });

  describe('hasStock', () => {
    it('should return true when stock is sufficient', () => {
      const part = createPart({ stockQuantity: 100 });

      expect(part.hasStock(50)).toBe(true);
    });

    it('should return true when requesting exact stock amount', () => {
      const part = createPart({ stockQuantity: 100 });

      expect(part.hasStock(100)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      const part = createPart({ stockQuantity: 30 });

      expect(part.hasStock(50)).toBe(false);
    });

    it('should not consider reserved quantity', () => {
      const part = createPart({ stockQuantity: 100, reservedQuantity: 90 });

      expect(part.hasStock(100)).toBe(true);
    });
  });

  describe('isLowStock', () => {
    it('should return true when available stock is below minimum', () => {
      const part = createPart({ stockQuantity: 15, reservedQuantity: 10, minimumStock: 10 });

      expect(part.isLowStock()).toBe(true);
    });

    it('should return true when available stock equals minimum', () => {
      const part = createPart({ stockQuantity: 20, reservedQuantity: 10, minimumStock: 10 });

      expect(part.isLowStock()).toBe(true);
    });

    it('should return false when available stock is above minimum', () => {
      const part = createPart({ stockQuantity: 50, reservedQuantity: 10, minimumStock: 10 });

      expect(part.isLowStock()).toBe(false);
    });

    it('should consider reserved quantity in calculation', () => {
      const part = createPart({ stockQuantity: 100, reservedQuantity: 95, minimumStock: 10 });

      // Available = 100 - 95 = 5, which is < 10
      expect(part.isLowStock()).toBe(true);
    });

    it('should return true when stock is zero', () => {
      const part = createPart({ stockQuantity: 0, reservedQuantity: 0, minimumStock: 10 });

      expect(part.isLowStock()).toBe(true);
    });

    it('should return false when minimum stock is zero and there is available stock', () => {
      const part = createPart({ stockQuantity: 10, reservedQuantity: 5, minimumStock: 0 });

      // Available = 5, minimum = 0, so 5 > 0 = false
      expect(part.isLowStock()).toBe(false);
    });
  });
});
