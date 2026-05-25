import { BaseEntity } from '@/shared/domain/base';

export class Service extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedMinutes: number;
}
