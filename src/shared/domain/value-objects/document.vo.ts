import { CustomerErrors } from '@/shared/domain/exceptions/errors';
import { Cpf } from './cpf.vo';
import { Cnpj } from './cnpj.vo';

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
}

export class Document {
  private readonly value: string;
  private readonly type: DocumentType;

  constructor(document: string) {
    const cleaned = document.replace(/\D/g, '');

    if (cleaned.length === 11) {
      const cpf = new Cpf(cleaned);
      this.value = cpf.getValue();
      this.type = DocumentType.CPF;
    } else if (cleaned.length === 14) {
      const cnpj = new Cnpj(cleaned);
      this.value = cnpj.getValue();
      this.type = DocumentType.CNPJ;
    } else {
      throw CustomerErrors.INVALID_DOCUMENT(document);
    }
  }

  getValue(): string {
    return this.value;
  }

  getType(): DocumentType {
    return this.type;
  }

  isCpf(): boolean {
    return this.type === DocumentType.CPF;
  }

  isCnpj(): boolean {
    return this.type === DocumentType.CNPJ;
  }

  getFormatted(): string {
    if (this.type === DocumentType.CPF) {
      return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return this.value.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }

  equals(other: Document): boolean {
    return this.value === other.getValue() && this.type === other.getType();
  }

  toString(): string {
    return this.value;
  }
}
