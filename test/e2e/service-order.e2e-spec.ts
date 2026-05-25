import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Service Order (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;
  let customerId: string;
  let vehicleId: string;
  let serviceId: string;
  let partId: string;
  let serviceOrderId: string;
  let orderNumber: string;

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

    // Setup: Create customer
    const customerResponse = await api.post('/api/admin/customers', {
      document: TestData.generateUniqueCpf(),
      name: 'Cliente OS Test',
      email: `ostest${Date.now()}@example.com`,
      phone: '11999999999',
    });
    customerId = customerResponse.body.id;

    // Setup: Create vehicle
    const vehicleResponse = await api.post('/api/admin/vehicles', {
      licensePlate: TestData.generateUniquePlate(),
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      color: 'Prata',
      customerId,
    });
    vehicleId = vehicleResponse.body.id;

    // Setup: Create service
    const serviceResponse = await api.post('/api/admin/services', {
      code: TestData.generateUniqueCode('SRV'),
      name: 'Troca de Óleo',
      description: 'Troca completa de óleo',
      basePrice: 150.0,
      estimatedMinutes: 60,
    });
    serviceId = serviceResponse.body.id;

    // Setup: Create part with stock
    const partResponse = await api.post('/api/admin/parts', {
      code: TestData.generateUniqueCode('PRT'),
      name: 'Filtro de Óleo',
      unitPrice: 35.0,
      stockQuantity: 100,
      minimumStock: 10,
    });
    partId = partResponse.body.id;
  });

  describe('POST /api/admin/service-orders', () => {
    it('should create a service order', async () => {
      const response = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Veículo apresentando barulho no motor',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body.status).toBe('RECEIVED');
      expect(response.body.customer.id).toBe(customerId);
      expect(response.body.vehicle.id).toBe(vehicleId);

      serviceOrderId = response.body.id;
      orderNumber = response.body.orderNumber;
    });

    it('should fail with non-existent customer', async () => {
      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';
      const response = await api.post('/api/admin/service-orders', {
        customerId: fakeCustomerId,
        vehicleId,
      });

      expect(response.status).toBe(404);
    });

    it('should fail with non-existent vehicle', async () => {
      const fakeVehicleId = '00000000-0000-0000-0000-000000000000';
      const response = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId: fakeVehicleId,
        observations: 'Test',
      });

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await api.post(
        '/api/admin/service-orders',
        {
          customerId,
          vehicleId,
          observations: 'Test',
        },
        false,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/service-orders', () => {
    it('should list all service orders', async () => {
      const response = await api.get('/api/admin/service-orders?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await api.get(
        '/api/admin/service-orders?page=1&limit=10&status=RECEIVED',
      );

      expect(response.status).toBe(200);
      response.body.data.forEach((order: any) => {
        expect(order.status).toBe('RECEIVED');
      });
    });

    it('should filter by customer', async () => {
      const response = await api.get(
        `/api/admin/service-orders?page=1&limit=10&customerId=${customerId}`,
      );

      expect(response.status).toBe(200);
      response.body.data.forEach((order: any) => {
        expect(order.customer.id).toBe(customerId);
      });
    });
  });

  describe('GET /api/admin/service-orders/:id', () => {
    it('should get service order by id', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${serviceOrderId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(serviceOrderId);
    });
  });

  describe('PATCH /api/admin/service-orders/:id/status', () => {
    it('should transition from RECEIVED to IN_DIAGNOSIS', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${serviceOrderId}/status`,
        { status: 'IN_DIAGNOSIS' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_DIAGNOSIS');
    });

    it('should fail with invalid status transition', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${serviceOrderId}/status`,
        { status: 'COMPLETED' },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/service-orders/:id/services', () => {
    let itemTestOrderId: string;

    beforeAll(async () => {
      // Create a fresh order for item tests
      const createResponse = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
      });
      itemTestOrderId = createResponse.body.id;
    });

    it('should add service to order', async () => {
      const response = await api.post(
        `/api/admin/service-orders/${itemTestOrderId}/services`,
        {
          serviceId,
          quantity: 1,
        },
      );

      expect(response.status).toBe(201);
      expect(response.body.services.length).toBeGreaterThan(0);
    });

    it('should fail with non-existent service', async () => {
      const fakeServiceId = '00000000-0000-0000-0000-000000000000';
      const response = await api.post(
        `/api/admin/service-orders/${itemTestOrderId}/services`,
        {
          serviceId: fakeServiceId,
          quantity: 1,
        },
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/admin/service-orders/:id/parts', () => {
    let partTestOrderId: string;

    beforeAll(async () => {
      // Create a fresh order for part tests
      const createResponse = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
      });
      partTestOrderId = createResponse.body.id;
    });

    it('should add part to order', async () => {
      const response = await api.post(
        `/api/admin/service-orders/${partTestOrderId}/parts`,
        {
          partId,
          quantity: 2,
        },
      );

      expect(response.status).toBe(201);
      expect(response.body.parts.length).toBeGreaterThan(0);
    });

    it('should fail with non-existent part', async () => {
      const fakePartId = '00000000-0000-0000-0000-000000000000';
      const response = await api.post(
        `/api/admin/service-orders/${partTestOrderId}/parts`,
        {
          partId: fakePartId,
          quantity: 1,
        },
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Service Order Status Workflow', () => {
    it('should transition to AWAITING_APPROVAL', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${serviceOrderId}/status`,
        { status: 'AWAITING_APPROVAL' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('AWAITING_APPROVAL');
    });

    it('should not allow adding items when AWAITING_APPROVAL', async () => {
      const response = await api.post(
        `/api/admin/service-orders/${serviceOrderId}/services`,
        {
          serviceId,
          quantity: 1,
        },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Public API - Customer Actions', () => {
    it('should get order status by order number (public)', async () => {
      const response = await api.get(
        `/api/public/service-orders/${orderNumber}`,
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.orderNumber).toBe(orderNumber);
      expect(response.body.status).toBe('AWAITING_APPROVAL');
    });

    it('should approve quote (customer action)', async () => {
      const response = await api.post(
        `/api/public/service-orders/${orderNumber}/approve`,
        {},
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('AWAITING_START');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await api.get(
        '/api/public/service-orders/OS-9999-99999',
        false,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Complete Order Workflow', () => {
    it('should transition to IN_PROGRESS', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${serviceOrderId}/status`,
        { status: 'IN_PROGRESS' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
    });

    it('should transition to COMPLETED', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${serviceOrderId}/status`,
        { status: 'COMPLETED' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COMPLETED');
    });

    it('should transition to DELIVERED', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${serviceOrderId}/status`,
        { status: 'DELIVERED' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('DELIVERED');
    });

    it('should not allow further transitions from DELIVERED', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${serviceOrderId}/status`,
        { status: 'CANCELLED' },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/service-orders/metrics', () => {
    it('should return general service order metrics', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('ordersByStatus');
      expect(response.body).toHaveProperty('averageCompletionTimeMinutes');
      expect(response.body).toHaveProperty('averageTimeByStatus');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('averageTicket');
      expect(response.body).toHaveProperty('ordersCreatedToday');
      expect(response.body).toHaveProperty('ordersCompletedToday');
    });
  });

  describe('GET /api/admin/service-orders/:id/metrics', () => {
    it('should return metrics for a specific order', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${serviceOrderId}/metrics`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orderId');
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timeByStatus');
      expect(response.body.orderId).toBe(serviceOrderId);
    });
  });

  describe('Quote Rejection Flow', () => {
    let rejectOrderNumber: string;

    beforeAll(async () => {
      // Create a new order for rejection test
      const createResponse = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Ordem para rejeição',
      });
      const rejectOrderId = createResponse.body.id;
      rejectOrderNumber = createResponse.body.orderNumber;

      // Move to IN_DIAGNOSIS
      await api.patch(`/api/admin/service-orders/${rejectOrderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      // Add items
      await api.post(`/api/admin/service-orders/${rejectOrderId}/services`, {
        serviceId,
        quantity: 1,
      });

      // Move to AWAITING_APPROVAL
      await api.patch(`/api/admin/service-orders/${rejectOrderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });
    });

    it('should reject quote (customer action)', async () => {
      const response = await api.post(
        `/api/public/service-orders/${rejectOrderNumber}/reject`,
        {},
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELLED');
    });
  });

  describe('DELETE items from order', () => {
    let editableOrderId: string;
    let serviceItemId: string;
    let partItemId: string;

    beforeAll(async () => {
      // Create a new order
      const createResponse = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Ordem para remover itens',
      });
      editableOrderId = createResponse.body.id;

      // Move to IN_DIAGNOSIS
      await api.patch(`/api/admin/service-orders/${editableOrderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      // Add service
      const serviceResponse = await api.post(
        `/api/admin/service-orders/${editableOrderId}/services`,
        { serviceId, quantity: 1 },
      );
      serviceItemId = serviceResponse.body.services[0].id;

      // Add part
      const partResponse = await api.post(
        `/api/admin/service-orders/${editableOrderId}/parts`,
        { partId, quantity: 1 },
      );
      partItemId = partResponse.body.parts[0].id;
    });

    it('should remove service from order', async () => {
      const response = await api.delete(
        `/api/admin/service-orders/${editableOrderId}/services/${serviceItemId}`,
      );

      expect(response.status).toBe(200);
    });

    it('should remove part from order', async () => {
      const response = await api.delete(
        `/api/admin/service-orders/${editableOrderId}/parts/${partItemId}`,
      );

      expect(response.status).toBe(200);
    });
  });
});
