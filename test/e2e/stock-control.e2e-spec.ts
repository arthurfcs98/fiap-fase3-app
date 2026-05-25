import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Stock Control (e2e)', () => {
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

  describe('Reserve-Release-Deduct Flow', () => {
    let customerId: string;
    let vehicleId: string;
    let partId: string;
    let orderId: string;
    let initialStock: number;

    beforeAll(async () => {
      // Create customer
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Estoque',
        email: TestData.generateUniqueEmail('stock'),
        phone: '11999999999',
      });
      customerId = customer.body.id;

      // Create vehicle
      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Ford',
        model: 'Ka',
        year: 2020,
        color: 'Azul',
        customerId,
      });
      vehicleId = vehicle.body.id;

      // Create part with known stock
      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('STK'),
        name: 'Peça Teste Estoque',
        unitPrice: 50.0,
        stockQuantity: 100,
        minimumStock: 10,
      });
      partId = part.body.id;
      initialStock = part.body.stockQuantity;
    });

    it('should reserve stock when adding part to order', async () => {
      // Create order
      const order = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Teste controle de estoque',
      });
      expect(order.status).toBe(201);
      orderId = order.body.id;

      // Move to IN_DIAGNOSIS
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      // Add part
      const addPart = await api.post(
        `/api/admin/service-orders/${orderId}/parts`,
        { partId, quantity: 10 },
      );
      expect(addPart.status).toBe(201);

      // Verify stock was reserved (stockQuantity same, but reserved increased)
      const partResponse = await api.get(`/api/admin/parts/${partId}`);
      expect(partResponse.body.stockQuantity).toBe(initialStock);
    });

    it('should increase reservation when adding more of same part', async () => {
      // Add more of the same part
      const addMore = await api.post(
        `/api/admin/service-orders/${orderId}/parts`,
        { partId, quantity: 5 },
      );
      expect(addMore.status).toBe(201);

      // Order should have 15 total quantity now
      const orderResponse = await api.get(`/api/admin/service-orders/${orderId}`);
      const partItem = orderResponse.body.parts.find((p: any) => p.partId === partId);
      expect(partItem.quantity).toBe(15);
    });

    it('should deduct stock when order is completed', async () => {
      // Move through statuses to complete
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });

      // Approve
      const orderRes = await api.get(`/api/admin/service-orders/${orderId}`);
      const orderNumber = orderRes.body.orderNumber;
      await api.post(`/api/public/service-orders/${orderNumber}/approve`, {}, false);

      // Start work
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_PROGRESS',
      });

      // Complete - this should deduct stock
      const completeResponse = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'COMPLETED' },
      );
      expect(completeResponse.status).toBe(200);

      // Verify stock was deducted
      const partResponse = await api.get(`/api/admin/parts/${partId}`);
      expect(partResponse.body.stockQuantity).toBe(initialStock - 15);
    });
  });

  describe('Cancellation Releases Stock', () => {
    let customerId: string;
    let vehicleId: string;
    let partId: string;
    let orderId: string;
    let initialStock: number;

    beforeAll(async () => {
      // Create customer
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Cancelamento Estoque',
        email: TestData.generateUniqueEmail('cancel-stock'),
        phone: '11999999999',
      });
      customerId = customer.body.id;

      // Create vehicle
      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Fiat',
        model: 'Palio',
        year: 2019,
        color: 'Vermelho',
        customerId,
      });
      vehicleId = vehicle.body.id;

      // Create part with known stock
      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('CAN'),
        name: 'Peça Teste Cancelamento',
        unitPrice: 30.0,
        stockQuantity: 50,
        minimumStock: 5,
      });
      partId = part.body.id;
      initialStock = part.body.stockQuantity;
    });

    it('should release reserved stock when order is cancelled', async () => {
      // Create order
      const order = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Teste cancelamento',
      });
      orderId = order.body.id;

      // Move to IN_DIAGNOSIS and add part
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      await api.post(`/api/admin/service-orders/${orderId}/parts`, {
        partId,
        quantity: 20,
      });

      // Move to AWAITING_APPROVAL
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });

      // Cancel order
      const cancelResponse = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'CANCELLED' },
      );
      expect(cancelResponse.status).toBe(200);

      // Verify stock was released (quantity unchanged)
      const partResponse = await api.get(`/api/admin/parts/${partId}`);
      expect(partResponse.body.stockQuantity).toBe(initialStock);
    });
  });

  describe('Insufficient Stock Validation', () => {
    let customerId: string;
    let vehicleId: string;
    let partId: string;
    let orderId: string;

    beforeAll(async () => {
      // Create customer
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Estoque Insuficiente',
        email: TestData.generateUniqueEmail('insuf'),
        phone: '11999999999',
      });
      customerId = customer.body.id;

      // Create vehicle
      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Renault',
        model: 'Sandero',
        year: 2018,
        color: 'Prata',
        customerId,
      });
      vehicleId = vehicle.body.id;

      // Create part with limited stock
      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('LIM'),
        name: 'Peça Estoque Limitado',
        unitPrice: 100.0,
        stockQuantity: 5,
        minimumStock: 2,
      });
      partId = part.body.id;
    });

    it('should fail when trying to add more parts than available stock', async () => {
      // Create order
      const order = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Teste estoque insuficiente',
      });
      orderId = order.body.id;

      // Move to IN_DIAGNOSIS
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      // Try to add more parts than available
      const addPart = await api.post(
        `/api/admin/service-orders/${orderId}/parts`,
        { partId, quantity: 10 },
      );

      expect(addPart.status).toBe(400);
    });
  });

  describe('Multiple Parts in Same Order', () => {
    let customerId: string;
    let vehicleId: string;
    let part1Id: string;
    let part2Id: string;
    let part3Id: string;
    let orderId: string;
    let initialStock1: number;
    let initialStock2: number;
    let initialStock3: number;

    beforeAll(async () => {
      // Create customer
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Múltiplas Peças',
        email: TestData.generateUniqueEmail('multi-parts'),
        phone: '11999999999',
      });
      customerId = customer.body.id;

      // Create vehicle
      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Hyundai',
        model: 'HB20',
        year: 2021,
        color: 'Branco',
        customerId,
      });
      vehicleId = vehicle.body.id;

      // Create three different parts
      const part1 = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('MP1'),
        name: 'Peça Multi 1',
        unitPrice: 25.0,
        stockQuantity: 30,
        minimumStock: 5,
      });
      part1Id = part1.body.id;
      initialStock1 = part1.body.stockQuantity;

      const part2 = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('MP2'),
        name: 'Peça Multi 2',
        unitPrice: 40.0,
        stockQuantity: 20,
        minimumStock: 3,
      });
      part2Id = part2.body.id;
      initialStock2 = part2.body.stockQuantity;

      const part3 = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('MP3'),
        name: 'Peça Multi 3',
        unitPrice: 60.0,
        stockQuantity: 15,
        minimumStock: 2,
      });
      part3Id = part3.body.id;
      initialStock3 = part3.body.stockQuantity;
    });

    it('should add multiple different parts to order', async () => {
      // Create order
      const order = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Teste múltiplas peças',
      });
      orderId = order.body.id;

      // Move to IN_DIAGNOSIS
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      // Add first part
      await api.post(`/api/admin/service-orders/${orderId}/parts`, {
        partId: part1Id,
        quantity: 5,
      });

      // Add second part
      await api.post(`/api/admin/service-orders/${orderId}/parts`, {
        partId: part2Id,
        quantity: 3,
      });

      // Add third part
      await api.post(`/api/admin/service-orders/${orderId}/parts`, {
        partId: part3Id,
        quantity: 2,
      });

      // Verify order has all parts
      const orderResponse = await api.get(`/api/admin/service-orders/${orderId}`);
      expect(orderResponse.body.parts).toHaveLength(3);
    });

    it('should deduct all parts stock when order is completed', async () => {
      // Move through statuses to complete
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });

      // Approve
      const orderRes = await api.get(`/api/admin/service-orders/${orderId}`);
      await api.post(
        `/api/public/service-orders/${orderRes.body.orderNumber}/approve`,
        {},
        false,
      );

      // Start and complete
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_PROGRESS',
      });

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'COMPLETED',
      });

      // Verify all stocks were deducted correctly
      const part1Response = await api.get(`/api/admin/parts/${part1Id}`);
      expect(part1Response.body.stockQuantity).toBe(initialStock1 - 5);

      const part2Response = await api.get(`/api/admin/parts/${part2Id}`);
      expect(part2Response.body.stockQuantity).toBe(initialStock2 - 3);

      const part3Response = await api.get(`/api/admin/parts/${part3Id}`);
      expect(part3Response.body.stockQuantity).toBe(initialStock3 - 2);
    });
  });

  describe('Quote Rejection Releases Stock', () => {
    let customerId: string;
    let vehicleId: string;
    let partId: string;
    let orderNumber: string;
    let initialStock: number;

    beforeAll(async () => {
      // Create customer
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Rejeição Estoque',
        email: TestData.generateUniqueEmail('reject-stock'),
        phone: '11999999999',
      });
      customerId = customer.body.id;

      // Create vehicle
      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Peugeot',
        model: '208',
        year: 2022,
        color: 'Laranja',
        customerId,
      });
      vehicleId = vehicle.body.id;

      // Create part with stock
      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('REJ'),
        name: 'Peça Teste Rejeição',
        unitPrice: 200.0,
        stockQuantity: 25,
        minimumStock: 5,
      });
      partId = part.body.id;
      initialStock = part.body.stockQuantity;
    });

    it('should release reserved stock when customer rejects quote', async () => {
      // Create order
      const order = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Teste rejeição orçamento',
      });
      const orderId = order.body.id;
      orderNumber = order.body.orderNumber;

      // Move to IN_DIAGNOSIS and add parts
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      await api.post(`/api/admin/service-orders/${orderId}/parts`, {
        partId,
        quantity: 8,
      });

      // Move to AWAITING_APPROVAL
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });

      // Customer rejects quote
      const rejectResponse = await api.post(
        `/api/public/service-orders/${orderNumber}/reject`,
        {},
        false,
      );
      expect(rejectResponse.status).toBe(200);
      expect(rejectResponse.body.status).toBe('CANCELLED');

      // Verify stock was released
      const partResponse = await api.get(`/api/admin/parts/${partId}`);
      expect(partResponse.body.stockQuantity).toBe(initialStock);
    });
  });
});
