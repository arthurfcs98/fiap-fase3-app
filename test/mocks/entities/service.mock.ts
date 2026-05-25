import { Service } from '@/modules/service/domain/entities/service.entity';

export const createMockService = (
  overrides: Partial<Service> = {},
): Service => {
  const service = new Service();
  service.id = 'service-uuid';
  service.code = 'SRV001';
  service.name = 'Oil Change';
  service.description = 'Complete oil change service';
  service.basePrice = 150;
  service.estimatedMinutes = 30;
  service.createdAt = new Date();
  service.updatedAt = new Date();

  return Object.assign(service, overrides);
};
