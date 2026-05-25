import { BaseEntity } from '@/shared/domain/base';

export class Customer extends BaseEntity {
  document: string;
  documentType: 'CPF' | 'CNPJ';
  name: string;
  email: string;
  phone: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  vehicles?: any[];
}
