import { LicensePlate } from '@/shared/domain/value-objects/license-plate.vo';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';

describe('LicensePlate Value Object', () => {
  describe('constructor', () => {
    it('should create a valid old format license plate', () => {
      const plate = new LicensePlate('ABC1234');
      expect(plate.getValue()).toBe('ABC1234');
    });

    it('should create a valid old format license plate with hyphen', () => {
      const plate = new LicensePlate('ABC-1234');
      expect(plate.getValue()).toBe('ABC1234');
    });

    it('should create a valid Mercosul format license plate', () => {
      const plate = new LicensePlate('ABC1D23');
      expect(plate.getValue()).toBe('ABC1D23');
    });

    it('should convert to uppercase', () => {
      const plate = new LicensePlate('abc1234');
      expect(plate.getValue()).toBe('ABC1234');
    });

    it('should throw AppErrorException for invalid format', () => {
      expect(() => new LicensePlate('ABCD123')).toThrow(AppErrorException);
    });

    it('should throw AppErrorException for too short plate', () => {
      expect(() => new LicensePlate('ABC123')).toThrow(AppErrorException);
    });

    it('should throw AppErrorException for invalid characters', () => {
      expect(() => new LicensePlate('AB@1234')).toThrow(AppErrorException);
    });
  });

  describe('getFormatted', () => {
    it('should return formatted old format plate', () => {
      const plate = new LicensePlate('ABC1234');
      expect(plate.getFormatted()).toBe('ABC-1234');
    });

    it('should return Mercosul format without hyphen', () => {
      const plate = new LicensePlate('ABC1D23');
      expect(plate.getFormatted()).toBe('ABC1D23');
    });
  });

  describe('isMercosul', () => {
    it('should return true for Mercosul format', () => {
      const plate = new LicensePlate('ABC1D23');
      expect(plate.isMercosul()).toBe(true);
    });

    it('should return false for old format', () => {
      const plate = new LicensePlate('ABC1234');
      expect(plate.isMercosul()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal plates', () => {
      const plate1 = new LicensePlate('ABC1234');
      const plate2 = new LicensePlate('abc-1234');
      expect(plate1.equals(plate2)).toBe(true);
    });

    it('should return false for different plates', () => {
      const plate1 = new LicensePlate('ABC1234');
      const plate2 = new LicensePlate('XYZ5678');
      expect(plate1.equals(plate2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the raw value', () => {
      const plate = new LicensePlate('ABC1234');
      expect(plate.toString()).toBe('ABC1234');
    });
  });
});
