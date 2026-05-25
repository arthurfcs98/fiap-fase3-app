import { Cpf } from '@/shared/domain/value-objects/cpf.vo';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';

describe('Cpf Value Object', () => {
  describe('constructor', () => {
    it('should create a valid CPF', () => {
      const cpf = new Cpf('52998224725');
      expect(cpf.getValue()).toBe('52998224725');
    });

    it('should create a valid CPF with formatting', () => {
      const cpf = new Cpf('529.982.247-25');
      expect(cpf.getValue()).toBe('52998224725');
    });

    it('should throw AppErrorException for invalid CPF', () => {
      expect(() => new Cpf('12345678901')).toThrow(AppErrorException);
    });

    it('should throw AppErrorException for CPF with all same digits', () => {
      expect(() => new Cpf('11111111111')).toThrow(AppErrorException);
    });

    it('should throw AppErrorException for CPF with wrong length', () => {
      expect(() => new Cpf('1234567890')).toThrow(AppErrorException);
    });

    it('should throw AppErrorException for CPF with invalid check digits', () => {
      expect(() => new Cpf('52998224726')).toThrow(AppErrorException);
    });

    it('should throw AppErrorException for CPF with invalid first check digit', () => {
      // Valid CPF with first digit wrong (should be 2, but is 3)
      expect(() => new Cpf('52998224735')).toThrow(AppErrorException);
    });

    it('should throw AppErrorException for CPF with invalid second check digit', () => {
      // Valid CPF except second check digit is wrong
      expect(() => new Cpf('52998224720')).toThrow(AppErrorException);
    });

    it('should validate CPF where second digit remainder is 10 or 11', () => {
      // 12345678909 is a valid CPF where the calculation can hit the remainder boundary
      const cpf = new Cpf('12345678909');
      expect(cpf.getValue()).toBe('12345678909');
    });

    it('should validate CPF with leading zeros', () => {
      // 01234567890 is actually a valid CPF
      const cpf = new Cpf('01234567890');
      expect(cpf.getValue()).toBe('01234567890');
    });

    it('should handle CPF validation with specific digit combinations', () => {
      // 11144477735 - a valid CPF already used in other tests
      const cpf = new Cpf('11144477735');
      expect(cpf.getValue()).toBe('11144477735');
    });
  });

  describe('getFormatted', () => {
    it('should return formatted CPF', () => {
      const cpf = new Cpf('52998224725');
      expect(cpf.getFormatted()).toBe('529.982.247-25');
    });
  });

  describe('equals', () => {
    it('should return true for equal CPFs', () => {
      const cpf1 = new Cpf('52998224725');
      const cpf2 = new Cpf('529.982.247-25');
      expect(cpf1.equals(cpf2)).toBe(true);
    });

    it('should return false for different CPFs', () => {
      const cpf1 = new Cpf('52998224725');
      const cpf2 = new Cpf('11144477735');
      expect(cpf1.equals(cpf2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the raw value', () => {
      const cpf = new Cpf('52998224725');
      expect(cpf.toString()).toBe('52998224725');
    });
  });
});
