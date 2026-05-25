import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Service (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;
  let serviceId: string;

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

  describe('POST /api/admin/services', () => {
    it('should create a service', async () => {
      const service = {
        ...TestData.service,
        code: TestData.generateUniqueCode('SRV'),
      };

      const response = await api.post('/api/admin/services', service);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe(service.code);
      expect(response.body.name).toBe(service.name);
      expect(response.body.basePrice).toBe(service.basePrice);

      serviceId = response.body.id;
    });

    it('should fail with duplicate code', async () => {
      const code = TestData.generateUniqueCode('SRV');

      // First service
      await api.post('/api/admin/services', {
        ...TestData.service,
        code,
      });

      // Duplicate code
      const response = await api.post('/api/admin/services', {
        ...TestData.service2,
        code,
      });

      expect(response.status).toBe(409);
    });

    it('should fail with negative price', async () => {
      const response = await api.post('/api/admin/services', {
        ...TestData.service,
        code: TestData.generateUniqueCode('SRV'),
        basePrice: -50,
      });

      expect(response.status).toBe(400);
    });

    it('should fail with zero estimated minutes', async () => {
      const response = await api.post('/api/admin/services', {
        ...TestData.service,
        code: TestData.generateUniqueCode('SRV'),
        estimatedMinutes: 0,
      });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await api.post(
        '/api/admin/services',
        TestData.service,
        false,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/services', () => {
    it('should list all services with pagination', async () => {
      const response = await api.get('/api/admin/services?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/admin/services/:id', () => {
    it('should get service by id', async () => {
      const response = await api.get(`/api/admin/services/${serviceId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(serviceId);
    });

    it('should return 404 for non-existent service', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api.get(`/api/admin/services/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/admin/services/:id', () => {
    it('should update service price', async () => {
      const response = await api.put(`/api/admin/services/${serviceId}`, {
        basePrice: 180.0,
      });

      expect(response.status).toBe(200);
      expect(response.body.basePrice).toBe(180.0);
    });

    it('should update service name', async () => {
      const response = await api.put(`/api/admin/services/${serviceId}`, {
        name: 'Troca de Óleo Completa',
      });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Troca de Óleo Completa');
    });

    it('should update estimated minutes', async () => {
      const response = await api.put(`/api/admin/services/${serviceId}`, {
        estimatedMinutes: 90,
      });

      expect(response.status).toBe(200);
      expect(response.body.estimatedMinutes).toBe(90);
    });
  });

  describe('DELETE /api/admin/services/:id', () => {
    it('should soft delete a service', async () => {
      const createResponse = await api.post('/api/admin/services', {
        ...TestData.service,
        code: TestData.generateUniqueCode('SRV'),
      });
      const deleteId = createResponse.body.id;

      const response = await api.delete(`/api/admin/services/${deleteId}`);

      expect(response.status).toBe(204);

      const getResponse = await api.get(`/api/admin/services/${deleteId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
