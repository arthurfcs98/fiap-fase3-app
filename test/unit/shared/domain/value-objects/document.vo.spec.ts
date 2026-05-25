import { AppErrorException } from '@/shared/domain/exceptions/app-error.exception';
import {
  Document,
  DocumentType,
} from "@/shared/domain/value-objects/document.vo";

describe("Document Value Object", () => {
  describe("constructor with CPF", () => {
    it("should create a valid Document from CPF", () => {
      const doc = new Document("52998224725");
      expect(doc.getValue()).toBe("52998224725");
      expect(doc.getType()).toBe(DocumentType.CPF);
    });

    it("should create a valid Document from formatted CPF", () => {
      const doc = new Document("529.982.247-25");
      expect(doc.getValue()).toBe("52998224725");
      expect(doc.getType()).toBe(DocumentType.CPF);
    });

    it("should identify as CPF", () => {
      const doc = new Document("52998224725");
      expect(doc.isCpf()).toBe(true);
      expect(doc.isCnpj()).toBe(false);
    });
  });

  describe("constructor with CNPJ", () => {
    it("should create a valid Document from CNPJ", () => {
      const doc = new Document("11222333000181");
      expect(doc.getValue()).toBe("11222333000181");
      expect(doc.getType()).toBe(DocumentType.CNPJ);
    });

    it("should create a valid Document from formatted CNPJ", () => {
      const doc = new Document("11.222.333/0001-81");
      expect(doc.getValue()).toBe("11222333000181");
      expect(doc.getType()).toBe(DocumentType.CNPJ);
    });

    it("should identify as CNPJ", () => {
      const doc = new Document("11222333000181");
      expect(doc.isCpf()).toBe(false);
      expect(doc.isCnpj()).toBe(true);
    });
  });

  describe("constructor with invalid document", () => {
    it("should throw AppErrorException for invalid length", () => {
      expect(() => new Document("123456789")).toThrow(AppErrorException);
    });

    it("should throw AppErrorException for invalid CPF", () => {
      expect(() => new Document("12345678901")).toThrow(AppErrorException);
    });

    it("should throw AppErrorException for invalid CNPJ", () => {
      expect(() => new Document("11222333000182")).toThrow(AppErrorException);
    });
  });

  describe("getFormatted", () => {
    it("should return formatted CPF", () => {
      const doc = new Document("52998224725");
      expect(doc.getFormatted()).toBe("529.982.247-25");
    });

    it("should return formatted CNPJ", () => {
      const doc = new Document("11222333000181");
      expect(doc.getFormatted()).toBe("11.222.333/0001-81");
    });
  });

  describe("equals", () => {
    it("should return true for equal documents", () => {
      const doc1 = new Document("52998224725");
      const doc2 = new Document("529.982.247-25");
      expect(doc1.equals(doc2)).toBe(true);
    });

    it("should return false for different documents", () => {
      const doc1 = new Document("52998224725");
      const doc2 = new Document("11222333000181");
      expect(doc1.equals(doc2)).toBe(false);
    });

    it("should return false for documents with different types", () => {
      const cpfDoc = new Document("52998224725");
      const cnpjDoc = new Document("11222333000181");
      expect(cpfDoc.equals(cnpjDoc)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return the raw CPF value", () => {
      const doc = new Document("52998224725");
      expect(doc.toString()).toBe("52998224725");
    });

    it("should return the raw CNPJ value", () => {
      const doc = new Document("11222333000181");
      expect(doc.toString()).toBe("11222333000181");
    });
  });
});
