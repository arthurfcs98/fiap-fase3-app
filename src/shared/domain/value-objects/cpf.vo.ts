import { CustomerErrors } from '@/shared/domain/exceptions/errors';

export class Cpf {
  private readonly value: string;

  constructor(cpf: string) {
    const cleaned = this.clean(cpf);
    if (!this.isValid(cleaned)) {
      throw CustomerErrors.INVALID_CPF(cpf);
    }
    this.value = cleaned;
  }

  private clean(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private isValid(cpf: string): boolean {
    if (cpf.length !== 11) {
      return false;
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.charAt(9))) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.charAt(10))) {
      return false;
    }

    return true;
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  equals(other: Cpf): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
