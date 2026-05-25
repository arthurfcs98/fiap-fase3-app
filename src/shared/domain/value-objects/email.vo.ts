import { CustomerErrors } from '@/shared/domain/exceptions/errors';

export class Email {
  private readonly value: string;

  constructor(email: string) {
    const trimmed = email.trim().toLowerCase();
    if (!this.isValid(trimmed)) {
      throw CustomerErrors.INVALID_EMAIL(email);
    }
    this.value = trimmed;
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
