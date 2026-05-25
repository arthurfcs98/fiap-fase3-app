import { VehicleErrors } from '@/shared/domain/exceptions/errors';

export class LicensePlate {
  private readonly value: string;

  constructor(plate: string) {
    const cleaned = this.clean(plate);
    if (!this.isValid(cleaned)) {
      throw VehicleErrors.INVALID_LICENSE_PLATE(plate);
    }
    this.value = cleaned.toUpperCase();
  }

  private clean(plate: string): string {
    return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  private isValid(plate: string): boolean {
    const oldPattern = /^[A-Z]{3}[0-9]{4}$/;

    const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

    return oldPattern.test(plate) || mercosulPattern.test(plate);
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    if (this.value.length === 7) {
      if (/^[A-Z]{3}[0-9]{4}$/.test(this.value)) {
        return `${this.value.slice(0, 3)}-${this.value.slice(3)}`;
      }
      return this.value;
    }
    return this.value;
  }

  isMercosul(): boolean {
    return /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(this.value);
  }

  equals(other: LicensePlate): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
