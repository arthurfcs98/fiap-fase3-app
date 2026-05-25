import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Part (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let partId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _lowStockPartId: string;

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

  describe('POST /api/admin/parts', () => {
    it('should create a part', async () => {
      const part = {
        ...TestData.part,
        code: TestData.generateUniqueCode('PRT'),
      };

      const response = await api.post('/api/admin/parts', part);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe(part.code);
      expect(response.body.name).toBe(part.name);
      expect(response.body.stockQuantity).toBe(part.stockQuantity);

      partId = response.body.id;
    });

    it('should create a low stock part', async () => {
      const part = {
        ...TestData.partLowStock,
        code: TestData.generateUniqueCode('PRT'),
      };

      const response = await api.post('/api/admin/parts', part);

      expect(response.status).toBe(201);
      expect(response.body.stockQuantity).toBeLessThan(
        response.body.minimumStock,
      );

      _lowStockPartId = response.body.id;
    });

    it('should fail with duplicate code', async () => {
      const code = TestData.generateUniqueCode('PRT');

      await api.post('/api/admin/parts', {
        ...TestData.part,
        code,
      });

      const response = await api.post('/api/admin/parts', {
        ...TestData.part2,
        code,
      });

      expect(response.status).toBe(409);
    });

    it('should fail with negative price', async () => {
      const response = await api.post('/api/admin/parts', {
        ...TestData.part,
        code: TestData.generateUniqueCode('PRT'),
        unitPrice: -10,
      });

      expect(response.status).toBe(400);
    });

    it('should fail with negative stock', async () => {
      const response = await api.post('/api/admin/parts', {
        ...TestData.part,
        code: TestData.generateUniqueCode('PRT'),
        stockQuantity: -5,
      });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await api.post('/api/admin/parts', TestData.part, false);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/parts', () => {
    it('should list all parts with pagination', async () => {
      const response = await api.get('/api/admin/parts?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/admin/parts/:id', () => {
    it('should get part by id', async () => {
      const response = await api.get(`/api/admin/parts/${partId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(partId);
    });

    it('should return 404 for non-existent part', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api.get(`/api/admin/parts/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/parts/low-stock', () => {
    it('should return parts with low stock', async () => {
      const response = await api.get('/api/admin/parts/low-stock');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All returned parts should have stockQuantity < minimumStock
      response.body.forEach((part: any) => {
        expect(part.stockQuantity).toBeLessThan(part.minimumStock);
      });
    });
  });

  describe('PATCH /api/admin/parts/:id/stock', () => {
    it('should add stock to part', async () => {
      const getResponse = await api.get(`/api/admin/parts/${partId}`);
      const currentStock = getResponse.body.stockQuantity;

      const response = await api.patch(`/api/admin/parts/${partId}/stock`, {
        quantity: 50,
        operation: 'ADD',
      });

      expect(response.status).toBe(200);
      expect(response.body.stockQuantity).toBe(currentStock + 50);
    });

    it('should remove stock from part', async () => {
      const getResponse = await api.get(`/api/admin/parts/${partId}`);
      const currentStock = getResponse.body.stockQuantity;

      const response = await api.patch(`/api/admin/parts/${partId}/stock`, {
        quantity: 10,
        operation: 'REMOVE',
      });

      expect(response.status).toBe(200);
      expect(response.body.stockQuantity).toBe(currentStock - 10);
    });

    it('should fail when removing more than available', async () => {
      const getResponse = await api.get(`/api/admin/parts/${partId}`);
      const currentStock = getResponse.body.stockQuantity;

      const response = await api.patch(`/api/admin/parts/${partId}/stock`, {
        quantity: currentStock + 100,
        operation: 'REMOVE',
      });

      expect(response.status).toBe(400);
    });

    it('should fail with invalid operation', async () => {
      const response = await api.patch(`/api/admin/parts/${partId}/stock`, {
        quantity: 10,
        operation: 'INVALID',
      });

      expect(response.status).toBe(400);
    });

    it('should fail with negative quantity for SET operation', async () => {
      const response = await api.patch(`/api/admin/parts/${partId}/stock`, {
        quantity: -10,
        operation: 'SET',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/parts/:id', () => {
    it('should update part price', async () => {
      const response = await api.put(`/api/admin/parts/${partId}`, {
        unitPrice: 50.0,
      });

      expect(response.status).toBe(200);
      expect(response.body.unitPrice).toBe(50.0);
    });

    it('should update minimum stock', async () => {
      const response = await api.put(`/api/admin/parts/${partId}`, {
        minimumStock: 15,
      });

      expect(response.status).toBe(200);
      expect(response.body.minimumStock).toBe(15);
    });
  });

  describe('DELETE /api/admin/parts/:id', () => {
    it('should soft delete a part', async () => {
      const createResponse = await api.post('/api/admin/parts', {
        ...TestData.part,
        code: TestData.generateUniqueCode('PRT'),
      });
      const deleteId = createResponse.body.id;

      const response = await api.delete(`/api/admin/parts/${deleteId}`);

      expect(response.status).toBe(204);

      const getResponse = await api.get(`/api/admin/parts/${deleteId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
