import { ServiceOrderMapper } from '@/modules/service-order/application/mappers/service-order.mapper';
import { ServiceOrderStatus } from '@/modules/service-order/domain/enums/service-order-status.enum';
import { ServiceOrder } from '@/modules/service-order/domain/entities/service-order.entity';
import { ServiceOrderItem } from '@/modules/service-order/domain/entities/service-order-item.entity';
import { ServiceOrderPart } from '@/modules/service-order/domain/entities/service-order-part.entity';

describe('ServiceOrderMapper', () => {
  const mockCustomer = {
    id: 'customer-uuid',
    name: 'John Doe',
    document: '12345678901',
    phone: '11999999999',
    email: 'john@example.com',
  };

  const mockVehicle = {
    id: 'vehicle-uuid',
    licensePlate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
  };

  const mockService = {
    id: 'service-uuid',
    code: 'SRV001',
    name: 'Oil Change',
    basePrice: 150,
  };

  const mockPart = {
    id: 'part-uuid',
    code: 'PRT001',
    name: 'Oil Filter',
    unitPrice: 25.5,
  };

  const createMockServiceItem = (
    overrides = {},
  ): Partial<ServiceOrderItem> => ({
    id: 'item-uuid',
    serviceOrderId: 'order-uuid',
    serviceId: 'service-uuid',
    service: mockService as any,
    quantity: 1,
    unitPrice: 150,
    subtotal: 150,
    ...overrides,
  });

  const createMockPartItem = (overrides = {}): Partial<ServiceOrderPart> => ({
    id: 'part-item-uuid',
    serviceOrderId: 'order-uuid',
    partId: 'part-uuid',
    part: mockPart as any,
    quantity: 2,
    unitPrice: 25.5,
    subtotal: 51,
    ...overrides,
  });

  const createMockServiceOrder = (overrides = {}) =>
    ({
      id: 'order-uuid',
      orderNumber: 'OS-2024-00001',
      customerId: 'customer-uuid',
      vehicleId: 'vehicle-uuid',
      status: ServiceOrderStatus.RECEIVED,
      customer: mockCustomer as any,
      vehicle: mockVehicle as any,
      serviceItems: [],
      partItems: [],
      totalAmount: 0,
      observations: null as string | null,
      diagnosisNotes: null as string | null,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      startedAt: null as Date | null,
      completedAt: null as Date | null,
      deliveredAt: null as Date | null,
      getExecutionTime: jest.fn().mockReturnValue(null),
      ...overrides,
    }) as unknown as ServiceOrder;

  describe('toOutput', () => {
    it('should map service order to output with all fields', () => {
      const order = createMockServiceOrder({
        observations: 'Test observation',
        diagnosisNotes: 'Test diagnosis',
        startedAt: new Date('2024-01-01T11:00:00Z'),
        completedAt: new Date('2024-01-01T12:00:00Z'),
        deliveredAt: new Date('2024-01-01T13:00:00Z'),
        getExecutionTime: jest.fn().mockReturnValue(60),
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.id).toBe('order-uuid');
      expect(result.orderNumber).toBe('OS-2024-00001');
      expect(result.status).toBe(ServiceOrderStatus.RECEIVED);
      expect(result.statusLabel).toBe('Recebida');
      expect(result.customer.id).toBe('customer-uuid');
      expect(result.customer.name).toBe('John Doe');
      expect(result.vehicle.id).toBe('vehicle-uuid');
      expect(result.vehicle.licensePlate).toBe('ABC1234');
      expect(result.observations).toBe('Test observation');
      expect(result.diagnosisNotes).toBe('Test diagnosis');
      expect(result.executionTimeMinutes).toBe(60);
      expect(result.startedAt).toEqual(new Date('2024-01-01T11:00:00Z'));
      expect(result.completedAt).toEqual(new Date('2024-01-01T12:00:00Z'));
      expect(result.deliveredAt).toEqual(new Date('2024-01-01T13:00:00Z'));
    });

    it('should return undefined for null optional fields', () => {
      const order = createMockServiceOrder();

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.observations).toBeUndefined();
      expect(result.diagnosisNotes).toBeUndefined();
      expect(result.executionTimeMinutes).toBeUndefined();
      expect(result.startedAt).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
      expect(result.deliveredAt).toBeUndefined();
    });

    it('should map service items correctly', () => {
      const serviceItem = createMockServiceItem();
      const order = createMockServiceOrder({
        serviceItems: [serviceItem as ServiceOrderItem],
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.services).toHaveLength(1);
      expect(result.services[0].id).toBe('item-uuid');
      expect(result.services[0].serviceId).toBe('service-uuid');
      expect(result.services[0].serviceName).toBe('Oil Change');
      expect(result.services[0].serviceCode).toBe('SRV001');
      expect(result.services[0].quantity).toBe(1);
      expect(result.services[0].unitPrice).toBe(150);
      expect(result.services[0].subtotal).toBe(150);
    });

    it('should map part items correctly', () => {
      const partItem = createMockPartItem();
      const order = createMockServiceOrder({
        partItems: [partItem as ServiceOrderPart],
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].id).toBe('part-item-uuid');
      expect(result.parts[0].partId).toBe('part-uuid');
      expect(result.parts[0].partName).toBe('Oil Filter');
      expect(result.parts[0].partCode).toBe('PRT001');
      expect(result.parts[0].quantity).toBe(2);
      expect(result.parts[0].unitPrice).toBe(25.5);
      expect(result.parts[0].subtotal).toBe(51);
    });

    it('should handle null service in service item', () => {
      const serviceItem = createMockServiceItem({ service: null });
      const order = createMockServiceOrder({
        serviceItems: [serviceItem as ServiceOrderItem],
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.services[0].serviceName).toBe('');
      expect(result.services[0].serviceCode).toBe('');
    });

    it('should handle null part in part item', () => {
      const partItem = createMockPartItem({ part: null });
      const order = createMockServiceOrder({
        partItems: [partItem as ServiceOrderPart],
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.parts[0].partName).toBe('');
      expect(result.parts[0].partCode).toBe('');
    });

    it('should handle undefined serviceItems and partItems', () => {
      const order = createMockServiceOrder({
        serviceItems: undefined,
        partItems: undefined,
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.services).toEqual([]);
      expect(result.parts).toEqual([]);
    });

    it('should convert totalAmount to number', () => {
      const order = createMockServiceOrder({
        totalAmount: '175.50' as any,
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.totalAmount).toBe(175.5);
      expect(typeof result.totalAmount).toBe('number');
    });
  });

  describe('toPublicOutput', () => {
    it('should map service order to public output', () => {
      const order = createMockServiceOrder({
        totalAmount: 200.5,
      });

      const result = ServiceOrderMapper.toPublicOutput(order);

      expect(result.orderNumber).toBe('OS-2024-00001');
      expect(result.status).toBe(ServiceOrderStatus.RECEIVED);
      expect(result.statusLabel).toBe('Recebida');
      expect(result.vehiclePlate).toBe('ABC1234');
      expect(result.vehicleDescription).toBe('Toyota Corolla');
      expect(result.totalAmount).toBe(200.5);
      expect(result.createdAt).toEqual(new Date('2024-01-01T10:00:00Z'));
    });

    it('should map services and parts', () => {
      const serviceItem = createMockServiceItem();
      const partItem = createMockPartItem();
      const order = createMockServiceOrder({
        serviceItems: [serviceItem as ServiceOrderItem],
        partItems: [partItem as ServiceOrderPart],
      });

      const result = ServiceOrderMapper.toPublicOutput(order);

      expect(result.services).toHaveLength(1);
      expect(result.parts).toHaveLength(1);
    });
  });

  describe('toResponseDto', () => {
    it('should map output to response DTO', () => {
      const output = {
        id: 'order-uuid',
        orderNumber: 'OS-2024-00001',
        status: ServiceOrderStatus.IN_PROGRESS,
        statusLabel: 'Em Andamento',
        customer: {
          id: 'customer-uuid',
          name: 'John Doe',
          document: '12345678901',
          phone: '11999999999',
          email: 'john@example.com',
        },
        vehicle: {
          id: 'vehicle-uuid',
          licensePlate: 'ABC1234',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
        },
        services: [],
        parts: [],
        totalAmount: 150,
        observations: 'Test',
        diagnosisNotes: 'Diagnosis',
        executionTimeMinutes: 45,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        startedAt: new Date('2024-01-01T11:00:00Z'),
        completedAt: undefined,
        deliveredAt: undefined,
      };

      const result = ServiceOrderMapper.toResponseDto(output);

      expect(result.id).toBe('order-uuid');
      expect(result.orderNumber).toBe('OS-2024-00001');
      expect(result.status).toBe(ServiceOrderStatus.IN_PROGRESS);
      expect(result.statusLabel).toBe('Em Andamento');
      expect(result.customer).toEqual(output.customer);
      expect(result.vehicle).toEqual(output.vehicle);
      expect(result.services).toEqual([]);
      expect(result.parts).toEqual([]);
      expect(result.totalAmount).toBe(150);
      expect(result.observations).toBe('Test');
      expect(result.diagnosisNotes).toBe('Diagnosis');
      expect(result.executionTimeMinutes).toBe(45);
      expect(result.startedAt).toEqual(new Date('2024-01-01T11:00:00Z'));
      expect(result.completedAt).toBeUndefined();
      expect(result.deliveredAt).toBeUndefined();
    });
  });

  describe('toPublicResponseDto', () => {
    it('should map public output to public response DTO', () => {
      const output = {
        orderNumber: 'OS-2024-00001',
        status: ServiceOrderStatus.COMPLETED,
        statusLabel: 'Concluído',
        vehiclePlate: 'ABC1234',
        vehicleDescription: 'Toyota Corolla',
        totalAmount: 250.75,
        services: [
          {
            id: 'item-uuid',
            serviceId: 'service-uuid',
            serviceName: 'Oil Change',
            serviceCode: 'SRV001',
            quantity: 1,
            unitPrice: 150,
            subtotal: 150,
          },
        ],
        parts: [
          {
            id: 'part-item-uuid',
            partId: 'part-uuid',
            partName: 'Oil Filter',
            partCode: 'PRT001',
            quantity: 2,
            unitPrice: 25.5,
            subtotal: 51,
          },
        ],
        createdAt: new Date('2024-01-01T10:00:00Z'),
      };

      const result = ServiceOrderMapper.toPublicResponseDto(output);

      expect(result.orderNumber).toBe('OS-2024-00001');
      expect(result.status).toBe(ServiceOrderStatus.COMPLETED);
      expect(result.statusLabel).toBe('Concluído');
      expect(result.vehiclePlate).toBe('ABC1234');
      expect(result.vehicleDescription).toBe('Toyota Corolla');
      expect(result.totalAmount).toBe(250.75);
      expect(result.services).toHaveLength(1);
      expect(result.parts).toHaveLength(1);
      expect(result.createdAt).toEqual(new Date('2024-01-01T10:00:00Z'));
    });
  });

  describe('mapServiceItems (private, tested through toOutput)', () => {
    it('should handle multiple service items', () => {
      const serviceItems = [
        createMockServiceItem({ id: 'item-1', quantity: 1, subtotal: 150 }),
        createMockServiceItem({ id: 'item-2', quantity: 2, subtotal: 300 }),
      ];
      const order = createMockServiceOrder({
        serviceItems: serviceItems as ServiceOrderItem[],
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.services).toHaveLength(2);
      expect(result.services[0].id).toBe('item-1');
      expect(result.services[1].id).toBe('item-2');
    });

    it('should handle undefined service properties', () => {
      const serviceItem = createMockServiceItem({
        service: { id: 'srv', code: undefined, name: undefined },
      });
      const order = createMockServiceOrder({
        serviceItems: [serviceItem as ServiceOrderItem],
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.services[0].serviceName).toBe('');
      expect(result.services[0].serviceCode).toBe('');
    });
  });

  describe('mapPartItems (private, tested through toOutput)', () => {
    it('should handle multiple part items', () => {
      const partItems = [
        createMockPartItem({ id: 'part-1', quantity: 2, subtotal: 51 }),
        createMockPartItem({ id: 'part-2', quantity: 4, subtotal: 102 }),
      ];
      const order = createMockServiceOrder({
        partItems: partItems as ServiceOrderPart[],
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.parts).toHaveLength(2);
      expect(result.parts[0].id).toBe('part-1');
      expect(result.parts[1].id).toBe('part-2');
    });

    it('should handle undefined part properties', () => {
      const partItem = createMockPartItem({
        part: { id: 'prt', code: undefined, name: undefined },
      });
      const order = createMockServiceOrder({
        partItems: [partItem as ServiceOrderPart],
      });

      const result = ServiceOrderMapper.toOutput(order);

      expect(result.parts[0].partName).toBe('');
      expect(result.parts[0].partCode).toBe('');
    });
  });
});
