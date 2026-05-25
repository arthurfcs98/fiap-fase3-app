import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Service Order AWAITING_START Status (e2e)', () => {
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

  describe('Transitions from AWAITING_START', () => {
    let customerId: string;
    let vehicleId: string;
    let serviceId: string;

    beforeAll(async () => {
      // Create customer
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente AWAITING_START',
        email: TestData.generateUniqueEmail('awaiting'),
        phone: '11999999999',
      });
      customerId = customer.body.id;

      // Create vehicle
      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Nissan',
        model: 'Kicks',
        year: 2023,
        color: 'Grafite',
        customerId,
      });
      vehicleId = vehicle.body.id;

      // Create service
      const service = await api.post('/api/admin/services', {
        code: TestData.generateUniqueCode('AWT'),
        name: 'Serviço AWAITING_START',
        description: 'Serviço para teste de status',
        basePrice: 200.0,
        estimatedMinutes: 90,
      });
      serviceId = service.body.id;
    });

    const createOrderInAwaitingStart = async (): Promise<{ orderId: string; orderNumber: string }> => {
      // Create order
      const order = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Teste AWAITING_START',
      });

      const orderId = order.body.id;
      const orderNumber = order.body.orderNumber;

      // Move through statuses
      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      await api.post(`/api/admin/service-orders/${orderId}/services`, {
        serviceId,
        quantity: 1,
      });

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });

      // Approve
      await api.post(`/api/public/service-orders/${orderNumber}/approve`, {}, false);

      return { orderId, orderNumber };
    };

    it('should allow transition from AWAITING_START to IN_PROGRESS', async () => {
      const { orderId } = await createOrderInAwaitingStart();

      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'IN_PROGRESS' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
    });

    it('should set startedAt when transitioning to IN_PROGRESS', async () => {
      const { orderId } = await createOrderInAwaitingStart();

      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'IN_PROGRESS' },
      );

      expect(response.status).toBe(200);
      expect(response.body.startedAt).not.toBeNull();
    });

    it('should allow transition from AWAITING_START to CANCELLED', async () => {
      const { orderId } = await createOrderInAwaitingStart();

      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'CANCELLED' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELLED');
    });

    it('should NOT allow direct transition from AWAITING_START to COMPLETED', async () => {
      const { orderId } = await createOrderInAwaitingStart();

      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'COMPLETED' },
      );

      expect(response.status).toBe(400);
    });

    it('should NOT allow direct transition from AWAITING_START to DELIVERED', async () => {
      const { orderId } = await createOrderInAwaitingStart();

      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'DELIVERED' },
      );

      expect(response.status).toBe(400);
    });

    it('should NOT allow transition from AWAITING_START to RECEIVED', async () => {
      const { orderId } = await createOrderInAwaitingStart();

      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'RECEIVED' },
      );

      expect(response.status).toBe(400);
    });

    it('should NOT allow transition from AWAITING_START to IN_DIAGNOSIS', async () => {
      const { orderId } = await createOrderInAwaitingStart();

      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'IN_DIAGNOSIS' },
      );

      expect(response.status).toBe(400);
    });

    it('should NOT allow transition from AWAITING_START to AWAITING_APPROVAL', async () => {
      const { orderId } = await createOrderInAwaitingStart();

      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'AWAITING_APPROVAL' },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Modification Restrictions in AWAITING_START', () => {
    let customerId: string;
    let vehicleId: string;
    let serviceId: string;
    let partId: string;
    let orderId: string;

    beforeAll(async () => {
      // Create customer
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Restrição AWAITING_START',
        email: TestData.generateUniqueEmail('restrict-await'),
        phone: '11999999999',
      });
      customerId = customer.body.id;

      // Create vehicle
      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Jeep',
        model: 'Renegade',
        year: 2022,
        color: 'Preto',
        customerId,
      });
      vehicleId = vehicle.body.id;

      // Create service
      const service = await api.post('/api/admin/services', {
        code: TestData.generateUniqueCode('RST'),
        name: 'Serviço Restrição',
        description: 'Serviço para teste de restrições',
        basePrice: 150.0,
        estimatedMinutes: 60,
      });
      serviceId = service.body.id;

      // Create part
      const part = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('RSP'),
        name: 'Peça Restrição',
        unitPrice: 75.0,
        stockQuantity: 30,
        minimumStock: 5,
      });
      partId = part.body.id;

      // Create and move order to AWAITING_START
      const order = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Teste restrições AWAITING_START',
      });
      orderId = order.body.id;
      const orderNumber = order.body.orderNumber;

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'IN_DIAGNOSIS',
      });

      await api.post(`/api/admin/service-orders/${orderId}/services`, {
        serviceId,
        quantity: 1,
      });

      await api.post(`/api/admin/service-orders/${orderId}/parts`, {
        partId,
        quantity: 2,
      });

      await api.patch(`/api/admin/service-orders/${orderId}/status`, {
        status: 'AWAITING_APPROVAL',
      });

      await api.post(`/api/public/service-orders/${orderNumber}/approve`, {}, false);
    });

    it('should NOT allow adding service in AWAITING_START status', async () => {
      const newService = await api.post('/api/admin/services', {
        code: TestData.generateUniqueCode('NEW'),
        name: 'Novo Serviço',
        description: 'Serviço adicional',
        basePrice: 100.0,
        estimatedMinutes: 30,
      });

      const response = await api.post(
        `/api/admin/service-orders/${orderId}/services`,
        { serviceId: newService.body.id, quantity: 1 },
      );

      expect(response.status).toBe(400);
    });

    it('should NOT allow adding part in AWAITING_START status', async () => {
      const newPart = await api.post('/api/admin/parts', {
        code: TestData.generateUniqueCode('NWP'),
        name: 'Nova Peça',
        unitPrice: 50.0,
        stockQuantity: 20,
        minimumStock: 3,
      });

      const response = await api.post(
        `/api/admin/service-orders/${orderId}/parts`,
        { partId: newPart.body.id, quantity: 1 },
      );

      expect(response.status).toBe(400);
    });

    it('should NOT allow removing service in AWAITING_START status', async () => {
      // Get order to find service item
      const orderResponse = await api.get(`/api/admin/service-orders/${orderId}`);
      const serviceItemId = orderResponse.body.services[0]?.id;

      if (serviceItemId) {
        const response = await api.delete(
          `/api/admin/service-orders/${orderId}/services/${serviceItemId}`,
        );

        expect(response.status).toBe(400);
      }
    });

    it('should NOT allow removing part in AWAITING_START status', async () => {
      // Get order to find part item
      const orderResponse = await api.get(`/api/admin/service-orders/${orderId}`);
      const partItemId = orderResponse.body.parts[0]?.id;

      if (partItemId) {
        const response = await api.delete(
          `/api/admin/service-orders/${orderId}/parts/${partItemId}`,
        );

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Complete Flow with Timestamps', () => {
    let customerId: string;
    let vehicleId: string;
    let serviceId: string;
    let orderId: string;
    let orderNumber: string;

    beforeAll(async () => {
      // Create customer
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Fluxo Timestamps',
        email: TestData.generateUniqueEmail('timestamps'),
        phone: '11999999999',
      });
      customerId = customer.body.id;

      // Create vehicle
      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'Kia',
        model: 'Sportage',
        year: 2023,
        color: 'Vermelho',
        customerId,
      });
      vehicleId = vehicle.body.id;

      // Create service
      const service = await api.post('/api/admin/services', {
        code: TestData.generateUniqueCode('TST'),
        name: 'Serviço Timestamps',
        description: 'Serviço para teste de timestamps',
        basePrice: 300.0,
        estimatedMinutes: 120,
      });
      serviceId = service.body.id;
    });

    it('Step 1: Create order (RECEIVED) - no timestamps set', async () => {
      const order = await api.post('/api/admin/service-orders', {
        customerId,
        vehicleId,
        observations: 'Teste fluxo completo com timestamps',
      });

      expect(order.status).toBe(201);
      expect(order.body.status).toBe('RECEIVED');
      expect(order.body.createdAt).not.toBeNull();
      expect(order.body.startedAt).toBeNull();
      expect(order.body.completedAt).toBeNull();
      expect(order.body.deliveredAt).toBeNull();

      orderId = order.body.id;
      orderNumber = order.body.orderNumber;
    });

    it('Step 2: Move to IN_DIAGNOSIS', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'IN_DIAGNOSIS' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_DIAGNOSIS');
    });

    it('Step 3: Add service and move to AWAITING_APPROVAL with diagnosisNotes', async () => {
      await api.post(`/api/admin/service-orders/${orderId}/services`, {
        serviceId,
        quantity: 1,
      });

      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        {
          status: 'AWAITING_APPROVAL',
          notes: 'Diagnóstico: Necessário troca de óleo e revisão de freios',
        },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('AWAITING_APPROVAL');
      expect(response.body.diagnosisNotes).toBe(
        'Diagnóstico: Necessário troca de óleo e revisão de freios',
      );
    });

    it('Step 4: Approve quote - moves to AWAITING_START', async () => {
      const response = await api.post(
        `/api/public/service-orders/${orderNumber}/approve`,
        {},
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('AWAITING_START');
      expect(response.body.approvedAt).not.toBeNull();
    });

    it('Step 5: Start work - moves to IN_PROGRESS and sets startedAt', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'IN_PROGRESS' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
      expect(response.body.startedAt).not.toBeNull();
      expect(response.body.completedAt).toBeNull();
    });

    it('Step 6: Complete work - moves to COMPLETED and sets completedAt', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'COMPLETED' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.completedAt).not.toBeNull();
      expect(response.body.deliveredAt).toBeNull();
    });

    it('Step 7: Deliver vehicle - moves to DELIVERED and sets deliveredAt', async () => {
      const response = await api.patch(
        `/api/admin/service-orders/${orderId}/status`,
        { status: 'DELIVERED' },
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('DELIVERED');
      expect(response.body.deliveredAt).not.toBeNull();
    });

    it('Step 8: Verify all timestamps are set correctly', async () => {
      const response = await api.get(`/api/admin/service-orders/${orderId}`);

      expect(response.status).toBe(200);
      expect(response.body.createdAt).not.toBeNull();
      expect(response.body.startedAt).not.toBeNull();
      expect(response.body.completedAt).not.toBeNull();
      expect(response.body.deliveredAt).not.toBeNull();

      // Timestamps should be in order
      const createdAt = new Date(response.body.createdAt).getTime();
      const startedAt = new Date(response.body.startedAt).getTime();
      const completedAt = new Date(response.body.completedAt).getTime();
      const deliveredAt = new Date(response.body.deliveredAt).getTime();

      expect(startedAt).toBeGreaterThanOrEqual(createdAt);
      expect(completedAt).toBeGreaterThanOrEqual(startedAt);
      expect(deliveredAt).toBeGreaterThanOrEqual(completedAt);
    });
  });

  describe('Public Endpoint Status Visibility', () => {
    let orderNumber: string;

    beforeAll(async () => {
      // Create customer
      const customer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Cliente Visibilidade Pública',
        email: TestData.generateUniqueEmail('public'),
        phone: '11999999999',
      });

      // Create vehicle
      const vehicle = await api.post('/api/admin/vehicles', {
        licensePlate: TestData.generateUniquePlate(),
        brand: 'BMW',
        model: 'X1',
        year: 2023,
        color: 'Azul',
        customerId: customer.body.id,
      });

      // Create service
      const service = await api.post('/api/admin/services', {
        code: TestData.generateUniqueCode('PUB'),
        name: 'Serviço Público',
        description: 'Serviço para teste público',
        basePrice: 500.0,
        estimatedMinutes: 180,
      });

      // Create order
      const order = await api.post('/api/admin/service-orders', {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        observations: 'Teste visibilidade pública',
      });
      orderNumber = order.body.orderNumber;
      const orderId = order.body.id;

      // Move to AWAITING_START
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

      await api.post(`/api/public/service-orders/${orderNumber}/approve`, {}, false);
    });

    it('should show AWAITING_START status on public endpoint', async () => {
      const response = await api.get(
        `/api/public/service-orders/${orderNumber}`,
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('AWAITING_START');
    });

    it('should NOT allow customer to approve already approved order', async () => {
      const response = await api.post(
        `/api/public/service-orders/${orderNumber}/approve`,
        {},
        false,
      );

      expect(response.status).toBe(400);
    });

    it('should NOT allow customer to reject already approved order', async () => {
      const response = await api.post(
        `/api/public/service-orders/${orderNumber}/reject`,
        {},
        false,
      );

      expect(response.status).toBe(400);
    });
  });
});
