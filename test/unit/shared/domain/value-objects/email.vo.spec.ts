import { Email } from '@/shared/domain/value-objects/email.vo';
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';

describe('Email Value Object', () => {
  describe('constructor', () => {
    it('should create a valid email', () => {
      const email = new Email('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should convert email to lowercase', () => {
      const email = new Email('Test@EXAMPLE.COM');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = new Email('  test@example.com  ');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw AppErrorException for invalid email format', () => {
      expect(() => new Email('invalid')).toThrow(AppErrorException);
      expect(() => new Email('invalid@')).toThrow(AppErrorException);
      expect(() => new Email('@invalid.com')).toThrow(AppErrorException);
      expect(() => new Email('invalid@.com')).toThrow(AppErrorException);
    });

    it('should throw AppErrorException for email without domain', () => {
      expect(() => new Email('test@example')).toThrow(AppErrorException);
    });
  });

  describe('getValue', () => {
    it('should return the email value', () => {
      const email = new Email('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('Test@Example.COM');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('other@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the email value', () => {
      const email = new Email('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});
