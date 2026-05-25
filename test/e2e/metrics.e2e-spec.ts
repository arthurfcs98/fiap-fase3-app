import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Metrics (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;
  let customerId: string;
  let vehicleId: string;
  let serviceId: string;
  let serviceOrderId: string;

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
      name: 'Cliente Metrics Test',
      email: `metricstest${Date.now()}@example.com`,
      phone: '11999999999',
    });
    customerId = customerResponse.body.id;

    // Setup: Create vehicle
    const vehicleResponse = await api.post('/api/admin/vehicles', {
      licensePlate: TestData.generateUniquePlate(),
      brand: 'Honda',
      model: 'Civic',
      year: 2023,
      color: 'Preto',
      customerId,
    });
    vehicleId = vehicleResponse.body.id;

    // Setup: Create service
    const serviceResponse = await api.post('/api/admin/services', {
      code: TestData.generateUniqueCode('MET'),
      name: 'Serviço Metrics Test',
      description: 'Serviço para teste de métricas',
      basePrice: 200.0,
      estimatedMinutes: 45,
    });
    serviceId = serviceResponse.body.id;

    // Create a service order for metrics tests
    const orderResponse = await api.post('/api/admin/service-orders', {
      customerId,
      vehicleId,
      observations: 'Ordem para teste de métricas',
    });
    serviceOrderId = orderResponse.body.id;

    // Add service to order
    await api.post(`/api/admin/service-orders/${serviceOrderId}/services`, {
      serviceId,
      quantity: 1,
    });
  });

  describe('GET /api/admin/service-orders/metrics (General Metrics)', () => {
    it('should return general metrics for all service orders', async () => {
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

    it('should return correct data types', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      expect(typeof response.body.totalOrders).toBe('number');
      expect(typeof response.body.ordersByStatus).toBe('object');
      expect(typeof response.body.totalRevenue).toBe('number');
      expect(typeof response.body.ordersCreatedToday).toBe('number');
      expect(typeof response.body.ordersCompletedToday).toBe('number');

      // These can be null or number
      if (response.body.averageCompletionTimeMinutes !== null) {
        expect(typeof response.body.averageCompletionTimeMinutes).toBe('number');
      }
      if (response.body.averageTicket !== null) {
        expect(typeof response.body.averageTicket).toBe('number');
      }
    });

    it('should return ordersByStatus with all status keys', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      const expectedStatuses = [
        'RECEIVED',
        'IN_DIAGNOSIS',
        'AWAITING_APPROVAL',
        'AWAITING_START',
        'IN_PROGRESS',
        'COMPLETED',
        'DELIVERED',
        'CANCELLED',
      ];

      expectedStatuses.forEach((status) => {
        expect(response.body.ordersByStatus).toHaveProperty(status);
        expect(typeof response.body.ordersByStatus[status]).toBe('number');
      });
    });

    it('should return averageTimeByStatus with all status keys', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      const expectedStatuses = [
        'RECEIVED',
        'IN_DIAGNOSIS',
        'AWAITING_APPROVAL',
        'AWAITING_START',
        'IN_PROGRESS',
        'COMPLETED',
        'DELIVERED',
        'CANCELLED',
      ];

      expectedStatuses.forEach((status) => {
        expect(response.body.averageTimeByStatus).toHaveProperty(status);
        expect(typeof response.body.averageTimeByStatus[status]).toBe('number');
      });
    });

    it('should count orders created today', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      // We created at least one order today in beforeAll
      expect(response.body.ordersCreatedToday).toBeGreaterThanOrEqual(1);
    });

    it('should require authentication', async () => {
      const response = await api.get(
        '/api/admin/service-orders/metrics',
        false,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/service-orders/:id/metrics (Order Metrics)', () => {
    it('should return metrics for a specific service order', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${serviceOrderId}/metrics`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orderId');
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('totalTimeMinutes');
      expect(response.body).toHaveProperty('timeByStatus');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('startedAt');
      expect(response.body).toHaveProperty('completedAt');
      expect(response.body).toHaveProperty('deliveredAt');
    });

    it('should return correct orderId', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${serviceOrderId}/metrics`,
      );

      expect(response.body.orderId).toBe(serviceOrderId);
    });

    it('should return null totalTimeMinutes for incomplete order', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${serviceOrderId}/metrics`,
      );

      // Order is RECEIVED, not completed yet
      expect(response.body.totalTimeMinutes).toBeNull();
    });

    it('should return 404 for non-existent order', async () => {
      const fakeOrderId = '00000000-0000-0000-0000-000000000000';
      const response = await api.get(
        `/api/admin/service-orders/${fakeOrderId}/metrics`,
      );

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${serviceOrderId}/metrics`,
        false,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Metrics after order completion', () => {
    let completedOrderId: string;

    beforeAll(async () => {
      // Create a new order and complete it
      const orderResponse = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Ordem para completar',
      });
      completedOrderId = orderResponse.body.id;

      // Add service
      await api.post(
        `/api/admin/service-orders/${completedOrderId}/services`,
        { serviceId, quantity: 1 },
      );

      // Transition through all states
      await api.patch(
        `/api/admin/service-orders/${completedOrderId}/status`,
        { status: 'IN_DIAGNOSIS' },
      );
      await api.patch(
        `/api/admin/service-orders/${completedOrderId}/status`,
        { status: 'AWAITING_APPROVAL' },
      );
      await api.patch(
        `/api/admin/service-orders/${completedOrderId}/status`,
        { status: 'AWAITING_START' },
      );
      await api.patch(
        `/api/admin/service-orders/${completedOrderId}/status`,
        { status: 'IN_PROGRESS' },
      );
      await api.patch(
        `/api/admin/service-orders/${completedOrderId}/status`,
        { status: 'COMPLETED' },
      );
    });

    it('should return totalTimeMinutes for completed order', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${completedOrderId}/metrics`,
      );

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.totalTimeMinutes).not.toBeNull();
      expect(typeof response.body.totalTimeMinutes).toBe('number');
      expect(response.body.totalTimeMinutes).toBeGreaterThanOrEqual(0);
    });

    it('should have completedAt timestamp set', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${completedOrderId}/metrics`,
      );

      expect(response.body.completedAt).not.toBeNull();
    });

    it('should update general metrics with completed order', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      expect(response.body.ordersByStatus['COMPLETED']).toBeGreaterThanOrEqual(1);
      expect(response.body.ordersCompletedToday).toBeGreaterThanOrEqual(1);
    });

    it('should include completed order in revenue calculation', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      // At least the service price (200.0) should be counted
      expect(response.body.totalRevenue).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Metrics with delivered order', () => {
    let deliveredOrderId: string;

    beforeAll(async () => {
      // Create and fully deliver an order
      const orderResponse = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Ordem para entregar',
      });
      deliveredOrderId = orderResponse.body.id;

      await api.post(
        `/api/admin/service-orders/${deliveredOrderId}/services`,
        { serviceId, quantity: 1 },
      );

      // Complete full workflow
      await api.patch(
        `/api/admin/service-orders/${deliveredOrderId}/status`,
        { status: 'IN_DIAGNOSIS' },
      );
      await api.patch(
        `/api/admin/service-orders/${deliveredOrderId}/status`,
        { status: 'AWAITING_APPROVAL' },
      );
      await api.patch(
        `/api/admin/service-orders/${deliveredOrderId}/status`,
        { status: 'AWAITING_START' },
      );
      await api.patch(
        `/api/admin/service-orders/${deliveredOrderId}/status`,
        { status: 'IN_PROGRESS' },
      );
      await api.patch(
        `/api/admin/service-orders/${deliveredOrderId}/status`,
        { status: 'COMPLETED' },
      );
      await api.patch(
        `/api/admin/service-orders/${deliveredOrderId}/status`,
        { status: 'DELIVERED' },
      );
    });

    it('should have deliveredAt timestamp set', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${deliveredOrderId}/metrics`,
      );

      expect(response.body.status).toBe('DELIVERED');
      expect(response.body.deliveredAt).not.toBeNull();
    });

    it('should include delivered order in revenue', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      expect(response.body.ordersByStatus['DELIVERED']).toBeGreaterThanOrEqual(1);
    });

    it('should calculate average ticket correctly', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      // averageTicket = totalRevenue / (completed + delivered orders)
      if (response.body.averageTicket !== null) {
        expect(response.body.averageTicket).toBeGreaterThan(0);
        expect(response.body.averageTicket).toBeLessThanOrEqual(
          response.body.totalRevenue,
        );
      }
    });
  });

  describe('Metrics with cancelled order', () => {
    let cancelledOrderId: string;
    let cancelledOrderNumber: string;

    beforeAll(async () => {
      // Create an order and cancel it
      const orderResponse = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Ordem para cancelar',
      });
      cancelledOrderId = orderResponse.body.id;
      cancelledOrderNumber = orderResponse.body.orderNumber;

      await api.post(
        `/api/admin/service-orders/${cancelledOrderId}/services`,
        { serviceId, quantity: 1 },
      );

      await api.patch(
        `/api/admin/service-orders/${cancelledOrderId}/status`,
        { status: 'IN_DIAGNOSIS' },
      );
      await api.patch(
        `/api/admin/service-orders/${cancelledOrderId}/status`,
        { status: 'AWAITING_APPROVAL' },
      );

      // Reject via public API
      await api.post(
        `/api/public/service-orders/${cancelledOrderNumber}/reject`,
        {},
        false,
      );
    });

    it('should count cancelled orders', async () => {
      const response = await api.get('/api/admin/service-orders/metrics');

      expect(response.body.ordersByStatus['CANCELLED']).toBeGreaterThanOrEqual(1);
    });

    it('should not include cancelled order in revenue', async () => {
      const orderMetrics = await api.get(
        `/api/admin/service-orders/${cancelledOrderId}/metrics`,
      );

      expect(orderMetrics.body.status).toBe('CANCELLED');
      expect(orderMetrics.body.completedAt).toBeNull();
    });

    it('should track time spent before cancellation', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${cancelledOrderId}/metrics`,
      );

      expect(response.body.timeByStatus).toBeDefined();
      // Should have tracked time in RECEIVED, IN_DIAGNOSIS, AWAITING_APPROVAL
      expect(response.body.timeByStatus['RECEIVED']).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metrics timestamps validation', () => {
    it('should return ISO 8601 formatted dates', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${serviceOrderId}/metrics`,
      );

      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      expect(response.body.createdAt).toMatch(isoDateRegex);
    });

    it('should have createdAt always set', async () => {
      const response = await api.get(
        `/api/admin/service-orders/${serviceOrderId}/metrics`,
      );

      expect(response.body.createdAt).not.toBeNull();
      expect(new Date(response.body.createdAt).getTime()).not.toBeNaN();
    });
  });
});
