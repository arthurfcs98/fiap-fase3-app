import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Business Rules Validation (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(async () => {
    app = await TestApp.getInstance();
    api = new ApiClient(app);

    if (!TestApp.getAccessToken()) {
      const loginResponse = await api.post(
        '/api/auth/login',
        TestData.admin,
        false,
      );
      TestApp.setAccessToken(loginResponse.body.accessToken);
    }
  });

  describe('Service Order Status Transitions', () => {
    let orderId: string;

    beforeEach(async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Status Test',
        email: `status${Date.now()}@example.com`,
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId: customer.body.id,
      });

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
      });

      orderId = order.body.id;
    });

    it('RECEIVED -> IN_DIAGNOSIS: should be allowed', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'IN_DIAGNOSIS' },
      );
      expect(response.status).toBe(200);
    });

    it('RECEIVED -> AWAITING_APPROVAL: should NOT be allowed', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'AWAITING_APPROVAL' },
      );
      expect(response.status).toBe(400);
    });

    it('RECEIVED -> IN_PROGRESS: should NOT be allowed', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'IN_PROGRESS' },
      );
      expect(response.status).toBe(400);
    });

    it('RECEIVED -> COMPLETED: should NOT be allowed', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'COMPLETED' },
      );
      expect(response.status).toBe(400);
    });

    it('RECEIVED -> DELIVERED: should NOT be allowed', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'DELIVERED' },
      );
      expect(response.status).toBe(400);
    });

    it('RECEIVED -> CANCELLED: should be allowed', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'CANCELLED' },
      );
      expect(response.status).toBe(200);
    });
  });

  describe('Adding Items Restriction by Status', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let serviceId: string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let _partId: string;

    beforeAll(async () => {
      const service = await api.post('/api/admin/services', {
        code: TestData.generateUniqueCode('SRV'),
        name: 'Test Service',
        description: 'Test',
        basePrice: 100.0,
        estimatedMinutes: 30,
      });
      serviceId = service.body.id;

      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('PRT'),
        name: 'Test Part',
        unitPrice: 50.0,
        stockQuantity: 100,
        minimumStock: 5,
      });
      _partId = part.body.id;
    });

    it('should allow adding items in RECEIVED status', async () => {
      const { orderId } = await createOrder();

      const response = await api.post(
        `/api/admin/service-orders/${orderId}/services`,
        { serviceId, quantity: 1 },
      );
      expect(response.status).toBe(201);
    });

    it('should allow adding items in IN_DIAGNOSIS status', async () => {
      const { orderId } = await createOrder();

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      const response = await api.post(
        `/api/admin/service-orders/${orderId}/services`,
        { serviceId, quantity: 1 },
      );
      expect(response.status).toBe(201);
    });

    it('should NOT allow adding items in AWAITING_APPROVAL status', async () => {
      const { orderId } = await createOrder();

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });

      const response = await api.post(
        `/api/admin/service-orders/${orderId}/services`,
        { serviceId, quantity: 1 },
      );
      expect(response.status).toBe(400);
    });

    it('should NOT allow adding items in AWAITING_START status', async () => {
      const { orderId, orderNumber } = await createOrder();

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });
      await api.post(
        `/api/public/service-orders/${orderNumber}/approve`,
        {},
        false,
      );

      // After approval, status is AWAITING_START
      const response = await api.post(
        `/api/admin/service-orders/${orderId}/services`,
        { serviceId, quantity: 1 },
      );
      expect(response.status).toBe(400);
    });

    it('should NOT allow adding items in IN_PROGRESS status', async () => {
      const { orderId, orderNumber } = await createOrder();

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });
      await api.post(
        `/api/public/service-orders/${orderNumber}/approve`,
        {},
        false,
      );
      // Move from AWAITING_START to IN_PROGRESS
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_PROGRESS',
      });

      const response = await api.post(
        `/api/admin/service-orders/${orderId}/services`,
        { serviceId, quantity: 1 },
      );
      expect(response.status).toBe(400);
    });

    async function createOrder() {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Item Test',
        email: `item${Date.now()}@example.com`,
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId: customer.body.id,
      });

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
      });

      return { orderId: order.body.id, orderNumber: order.body.orderNumber };
    }
  });

  describe('Quote Approval/Rejection Timing', () => {
    it('should NOT allow approval when not in AWAITING_APPROVAL', async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Approval Test',
        email: `approval${Date.now()}@example.com`,
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId: customer.body.id,
      });

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
      });

      // Try to approve when in RECEIVED status
      const response = await api.post(
        `/api/public/service-orders/${order.body.orderNumber}/approve`,
        {},
        false,
      );

      expect(response.status).toBe(400);
    });

    it('should NOT allow rejection when not in AWAITING_APPROVAL', async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Rejection Test',
        email: `rejection${Date.now()}@example.com`,
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId: customer.body.id,
      });

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
      });

      // Move to IN_DIAGNOSIS
      await api.patch(`/api/admin/service-orders/${order.body.id}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      // Try to reject when in IN_DIAGNOSIS status
      const response = await api.post(
        `/api/public/service-orders/${order.body.orderNumber}/reject`,
        {},
        false,
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Document Validation', () => {
    it('should reject invalid CPF', async () => {
      const response = await api.post('/api/admin/customers', {
        document: '11111111111',
        name: 'Invalid CPF',
        email: `invalidcpf${Date.now()}@example.com`,
        phone: '11999999999',
      });

      expect(response.status).toBe(400);
    });

    it('should reject invalid CNPJ', async () => {
      const response = await api.post('/api/admin/customers', {
        document: '11111111111111',
        name: 'Invalid CNPJ',
        email: `invalidcnpj${Date.now()}@example.com`,
        phone: '11999999999',
      });

      expect(response.status).toBe(400);
    });

    it('should accept valid CPF', async () => {
      const response = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Valid CPF',
        email: `validcpf${Date.now()}@example.com`,
        phone: '11999999999',
      });

      expect(response.status).toBe(201);
      expect(response.body.documentType).toBe('CPF');
    });

    it('should accept valid CNPJ', async () => {
      const response = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCnpj(),
        name: 'Valid CNPJ',
        email: `validcnpj${Date.now()}@example.com`,
        phone: '11999999999',
      });

      expect(response.status).toBe(201);
      expect(response.body.documentType).toBe('CNPJ');
    });
  });

  describe('License Plate Validation', () => {
    let customerId: string;

    beforeAll(async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Plate Test',
        email: `plate${Date.now()}@example.com`,
        phone: '11999999999',
      });
      customerId = customer.body.id;
    });

    it('should accept old format plate (ABC1234)', async () => {
      const response = await api.post('/api/admin/vehicles', {
        licensePlate: 'ABC1234',
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId,
      });

      expect(response.status).toBe(201);
    });

    it('should accept new Mercosul format (ABC1D23)', async () => {
      const response = await api.post('/api/admin/vehicles', {
        licensePlate: 'ABC1D23',
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId,
      });

      expect(response.status).toBe(201);
    });

    it('should reject invalid plate format', async () => {
      const response = await api.post('/api/admin/vehicles', {
        licensePlate: 'INVALID',
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId,
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Stock Reservation Rules', () => {
    let partId: string;
    let initialStock: number;

    beforeAll(async () => {
      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('RES'),
        name: 'Reservation Test Part',
        unitPrice: 50.0,
        stockQuantity: 100,
        minimumStock: 10,
      });
      partId = part.body.id;
      initialStock = part.body.stockQuantity;
    });

    it('should reserve stock when part is added to order', async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Reserve Test',
        email: TestData.generateUniqueEmail('reserve'),
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId: customer.body.id,
      });

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
      });

      await api.patch(`/api/admin/service-orders/${order.body.id}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      // Add 30 units
      await api.post(`/api/admin/service-orders/${order.body.id}/parts`, {
        partId,
        quantity: 30,
      });

      // Stock quantity should remain the same (not deducted yet)
      const partResponse = await api.get(`/api/admin/parts/${partId}`);
      expect(partResponse.body.stockQuantity).toBe(initialStock);
    });

    it('should release reserved stock when order is cancelled', async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cancel Reserve Test',
        email: TestData.generateUniqueEmail('cancel-res'),
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId: customer.body.id,
      });

      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('CAN'),
        name: 'Cancel Reservation Part',
        unitPrice: 60.0,
        stockQuantity: 50,
        minimumStock: 5,
      });

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
      });

      await api.patch(`/api/admin/service-orders/${order.body.id}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      await api.post(`/api/admin/service-orders/${order.body.id}/parts`, {
        partId: part.body.id,
        quantity: 15,
      });

      // Cancel order
      await api.patch(`/api/admin/service-orders/${order.body.id}/status`, {
        status: 'CANCELLED',
      });

      // Stock should be unchanged (reservation released, no deduction)
      const partResponse = await api.get(`/api/admin/parts/${part.body.id}`);
      expect(partResponse.body.stockQuantity).toBe(50);
    });
  });

  describe('Price Calculation', () => {
    it('should calculate total correctly with services and parts', async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Calc Test',
        email: `calc${Date.now()}@example.com`,
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Test',
        model: 'Car',
        year: 2020,
        color: 'Test',
        customerId: customer.body.id,
      });

      const service = await api.post('/api/admin/services', {
        code: TestData.generateUniqueCode('SRV'),
        name: 'Calc Service',
        description: 'Test',
        basePrice: 200.0,
        estimatedMinutes: 60,
      });

      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('PRT'),
        name: 'Calc Part',
        unitPrice: 75.0,
        stockQuantity: 100,
        minimumStock: 5,
      });

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
      });

      // Add service (200.00 x 2 = 400.00)
      await api.post(`/api/admin/service-orders/${order.body.id}/services`, {
        serviceId: service.body.id,
        quantity: 2,
      });

      // Add parts (75.00 x 3 = 225.00)
      await api.post(`/api/admin/service-orders/${order.body.id}/parts`, {
        partId: part.body.id,
        quantity: 3,
      });

      const response = await api.get(
        `/api/admin/service-orders/${order.body.id}`,
      );

      // Total should be 400.00 + 225.00 = 625.00
      expect(response.body.totalAmount).toBe(625.0);
    });
  });
});
