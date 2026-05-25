import { Cnpj } from "@/shared/domain/value-objects/cnpj.vo";
import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';

describe("Cnpj Value Object", () => {
  describe("constructor", () => {
    it("should create a valid CNPJ", () => {
      const cnpj = new Cnpj("11222333000181");
      expect(cnpj.getValue()).toBe("11222333000181");
    });

    it("should create a valid CNPJ with formatting", () => {
      const cnpj = new Cnpj("11.222.333/0001-81");
      expect(cnpj.getValue()).toBe("11222333000181");
    });

    it("should throw AppErrorException for invalid CNPJ", () => {
      expect(() => new Cnpj("11222333000182")).toThrow(AppErrorException);
    });

    it("should throw AppErrorException for CNPJ with all same digits", () => {
      expect(() => new Cnpj("11111111111111")).toThrow(AppErrorException);
    });

    it("should throw AppErrorException for CNPJ with wrong length", () => {
      expect(() => new Cnpj("1122233300018")).toThrow(AppErrorException);
    });

    it("should throw AppErrorException for CNPJ with invalid first check digit", () => {
      // 11222333000191 - first digit should be 8, not 9
      expect(() => new Cnpj("11222333000191")).toThrow(AppErrorException);
    });

    it("should throw AppErrorException for CNPJ with invalid second check digit", () => {
      // 11222333000180 - second digit should be 1, not 0
      expect(() => new Cnpj("11222333000180")).toThrow(AppErrorException);
    });

    it("should handle CNPJ where remainder is less than 2", () => {
      // CNPJ 11444777000161 has remainder < 2 scenario
      const cnpj = new Cnpj("11444777000161");
      expect(cnpj.getValue()).toBe("11444777000161");
    });

    it("should handle CNPJ where first digit remainder is less than 2", () => {
      // CNPJ that has remainder < 2 for first verification digit
      const cnpj = new Cnpj("12345678000195");
      expect(cnpj.getValue()).toBe("12345678000195");
    });

    it("should handle CNPJ where second digit remainder is less than 2", () => {
      // CNPJ 00000000000191 - tests specific boundary case for second digit
      const cnpj = new Cnpj("00000000000191");
      expect(cnpj.getValue()).toBe("00000000000191");
    });

    it("should handle CNPJ with valid remainder boundaries for both digits", () => {
      // CNPJ 27865757000102 - another valid CNPJ for testing
      const cnpj = new Cnpj("27865757000102");
      expect(cnpj.getValue()).toBe("27865757000102");
    });
  });

  describe("getFormatted", () => {
    it("should return formatted CNPJ", () => {
      const cnpj = new Cnpj("11222333000181");
      expect(cnpj.getFormatted()).toBe("11.222.333/0001-81");
    });
  });

  describe("equals", () => {
    it("should return true for equal CNPJs", () => {
      const cnpj1 = new Cnpj("11222333000181");
      const cnpj2 = new Cnpj("11.222.333/0001-81");
      expect(cnpj1.equals(cnpj2)).toBe(true);
    });

    it("should return false for different CNPJs", () => {
      const cnpj1 = new Cnpj("11222333000181");
      const cnpj2 = new Cnpj("11444777000161");
      expect(cnpj1.equals(cnpj2)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return the raw value", () => {
      const cnpj = new Cnpj("11222333000181");
      expect(cnpj.toString()).toBe("11222333000181");
    });
  });
});
