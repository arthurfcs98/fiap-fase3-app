import { CustomerErrors } from '@/shared/domain/exceptions/errors';

export class Cnpj {
  private readonly value: string;

  constructor(cnpj: string) {
    const cleaned = this.clean(cnpj);
    if (!this.isValid(cleaned)) {
      throw CustomerErrors.INVALID_CNPJ(cnpj);
    }
    this.value = cleaned;
  }

  private clean(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  private isValid(cnpj: string): boolean {
    if (cnpj.length !== 14) {
      return false;
    }

    if (/^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cnpj.charAt(12))) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cnpj.charAt(13))) {
      return false;
    }

    return true;
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    return this.value.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }

  equals(other: Cnpj): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
