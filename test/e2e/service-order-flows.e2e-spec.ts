import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Service Order Complete Flows (e2e)', () => {
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

  describe('Complete Happy Path Flow', () => {
    let customerId: string;
    let vehicleId: string;
    let serviceId: string;
    let partId: string;
    let orderId: string;
    let orderNumber: string;
    let initialPartStock: number;

    it('Step 1: Create customer', async () => {
      const response = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Fluxo Completo',
        email: `flowtest${Date.now()}@example.com`,
        phone: '11999999999',
      });

      expect(response.status).toBe(201);
      customerId = response.body.id;
    });

    it('Step 2: Create vehicle for customer', async () => {
      const response = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Volkswagen',
        model: 'Gol',
        year: 2020,
        color: 'Branco',
        customerId,
      });

      expect(response.status).toBe(201);
      vehicleId = response.body.id;
    });

    it('Step 3: Create available service', async () => {
      const response = await api.post('/api/admin/services', {
        code: TestData.generateUniqueCode('SRV'),
        name: 'Revisão Completa',
        description: 'Revisão completa do veículo',
        basePrice: 350.0,
        estimatedMinutes: 120,
      });

      expect(response.status).toBe(201);
      serviceId = response.body.id;
    });

    it('Step 4: Create part with stock', async () => {
      const response = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('PRT'),
        name: 'Óleo Motor Sintético',
        unitPrice: 80.0,
        stockQuantity: 50,
        minimumStock: 10,
      });

      expect(response.status).toBe(201);
      partId = response.body.id;
      initialPartStock = response.body.stockQuantity;
    });

    it('Step 5: Create service order (status: RECEIVED)', async () => {
      const response = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Cliente solicita revisão completa',
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('RECEIVED');
      orderId = response.body.id;
      orderNumber = response.body.orderNumber;
    });

    it('Step 6: Start diagnosis (status: IN_DIAGNOSIS)', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'IN_DIAGNOSIS' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_DIAGNOSIS');
    });

    it('Step 7: Add service to order', async () => {
      const response = await api.post(
        `/api/admin/service-orders/${orderId}/services`,
        { serviceId, quantity: 1 },
      );

      expect(response.status).toBe(201);
      expect(response.body.services).toHaveLength(1);
      expect(response.body.services[0].unitPrice).toBe(350.0);
    });

    it('Step 8: Add parts to order', async () => {
      const response = await api.post(
        `/api/admin/service-orders/${orderId}/parts`,
        { partId, quantity: 4 },
      );

      expect(response.status).toBe(201);
      expect(response.body.parts).toHaveLength(1);
      expect(response.body.parts[0].quantity).toBe(4);
    });

    it('Step 9: Verify total calculation', async () => {
      const response = await api.get(`/api/admin/service-orders/${orderId}`);

      expect(response.status).toBe(200);
      // Service: 350.00 + Parts: 80.00 * 4 = 670.00
      expect(response.body.totalAmount).toBe(670.0);
    });

    it('Step 10: Send quote for approval (status: AWAITING_APPROVAL)', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'AWAITING_APPROVAL' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('AWAITING_APPROVAL');
    });

    it('Step 11: Customer views order status (public endpoint)', async () => {
      const response = await api.get(
        `/api/public/service-orders/${orderNumber}`,
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('AWAITING_APPROVAL');
      expect(response.body.totalAmount).toBe(670.0);
    });

    it('Step 12: Customer approves quote (status: AWAITING_START)', async () => {
      const response = await api.post(
        `/api/public/service-orders/${orderNumber}/approve`,
        {},
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('AWAITING_START');
    });

    it('Step 13: Start work (status: IN_PROGRESS)', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'IN_PROGRESS' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
    });

    it('Step 14: Complete service (status: COMPLETED)', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'COMPLETED' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COMPLETED');
    });

    it('Step 15: Deliver vehicle (status: DELIVERED)', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'DELIVERED' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('DELIVERED');
    });

    it('Step 16: Customer views final status', async () => {
      const response = await api.get(
        `/api/public/service-orders/${orderNumber}`,
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('DELIVERED');
    });

    it('Step 17: Verify stock was deducted after completion', async () => {
      const partResponse = await api.get(`/api/admin/parts/${partId}`);

      expect(partResponse.status).toBe(200);
      // Initial stock was 50, we used 4 parts
      expect(partResponse.body.stockQuantity).toBe(initialPartStock - 4);
    });
  });

  describe('Cancellation Flow', () => {
    let orderId: string;

    beforeAll(async () => {
      // Quick setup
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Cancelamento',
        email: `cancel${Date.now()}@example.com`,
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Fiat',
        model: 'Uno',
        year: 2018,
        color: 'Vermelho',
        customerId: customer.body.id,
      });

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        observations: 'Ordem para cancelar',
      });

      orderId = order.body.id;
    });

    it('should cancel order from RECEIVED status', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'CANCELLED' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELLED');
    });

    it('should not allow any transition from CANCELLED', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'RECEIVED' },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Quote Rejection by Customer Flow', () => {
    let orderNumber: string;

    beforeAll(async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Rejeição',
        email: `reject${Date.now()}@example.com`,
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Chevrolet',
        model: 'Onix',
        year: 2021,
        color: 'Cinza',
        customerId: customer.body.id,
      });

      const service = await api.post('/api/admin/services', {
        code: TestData.generateUniqueCode('SRV'),
        name: 'Serviço Caro',
        description: 'Serviço muito caro',
        basePrice: 5000.0,
        estimatedMinutes: 480,
      });

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        observations: 'Verificar problema',
      });

      orderNumber = order.body.orderNumber;
      const orderId = order.body.id;

      // Move through statuses
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      await api.post(`/api/admin/service-orders/${orderId}/services`, {
        serviceId: service.body.id,
        quantity: 1,
      });

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });
    });

    it('should show high price to customer', async () => {
      const response = await api.get(
        `/api/public/service-orders/${orderNumber}`,
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.totalAmount).toBe(5000.0);
    });

    it('should reject expensive quote', async () => {
      const response = await api.post(
        `/api/public/service-orders/${orderNumber}/reject`,
        {},
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELLED');
    });
  });

  describe('Quote Rejection with Parts - Stock Release', () => {
    let orderNumber: string;
    let partId: string;
    let initialPartStock: number;

    beforeAll(async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Rejeição Peças',
        email: TestData.generateUniqueEmail('reject-parts'),
        phone: '11999999999',
      });

      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Citroën',
        model: 'C3',
        year: 2020,
        color: 'Azul',
        customerId: customer.body.id,
      });

      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('REJ'),
        name: 'Peça Rejeição',
        unitPrice: 150.0,
        stockQuantity: 40,
        minimumStock: 5,
      });
      partId = part.body.id;
      initialPartStock = part.body.stockQuantity;

      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        observations: 'Verificar problema com peças',
      });

      orderNumber = order.body.orderNumber;
      const orderId = order.body.id;

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      await api.post(`/api/admin/service-orders/${orderId}/parts`, {
        partId,
        quantity: 10,
      });

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });
    });

    it('should release reserved stock when quote is rejected', async () => {
      const response = await api.post(
        `/api/public/service-orders/${orderNumber}/reject`,
        {},
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELLED');

      // Verify stock was released (not deducted)
      const partResponse = await api.get(`/api/admin/parts/${partId}`);
      expect(partResponse.body.stockQuantity).toBe(initialPartStock);
    });
  });

  describe('Multiple Orders for Same Customer', () => {
    let customerId: string;
    let vehicle1Id: string;
    let vehicle2Id: string;

    beforeAll(async () => {
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Múltiplos Veículos',
        email: `multi${Date.now()}@example.com`,
        phone: '11999999999',
      });
      customerId = customer.body.id;

      const vehicle1 = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        color: 'Prata',
        customerId,
      });
      vehicle1Id = vehicle1.body.id;

      const vehicle2 = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Honda',
        model: 'Civic',
        year: 2021,
        color: 'Preto',
        customerId,
      });
      vehicle2Id = vehicle2.body.id;
    });

    it('should create orders for different vehicles', async () => {
      const order1 = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId: vehicle1Id,
        observations: 'Manutenção Corolla',
      });

      const order2 = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId: vehicle2Id,
        observations: 'Manutenção Civic',
      });

      expect(order1.status).toBe(201);
      expect(order2.status).toBe(201);
      expect(order1.body.orderNumber).not.toBe(order2.body.orderNumber);
    });

    it('should filter orders by customer', async () => {
      const response = await api.get(
        `/api/admin/service-orders?page=1&limit=10&customerId=${customerId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should list orders with pagination', async () => {
      const response = await api.get(
        `/api/admin/service-orders?page=1&limit=10`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });
});
