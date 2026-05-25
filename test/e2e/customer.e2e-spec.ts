import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Customer (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;
  let createdCustomerId: string;

  beforeAll(async () => {
    app = await TestApp.getInstance();
    api = new ApiClient(app);

    // Ensure we have a valid token
    if (!TestApp.getAccessToken()) {
      const loginResponse = await api.post(
        '/api/auth/login',
        TestData.admin,
        false,
      );
      TestApp.setAccessToken(loginResponse.body.accessToken);
    }
  });

  describe('POST /api/admin/customers', () => {
    it('should create a customer with CPF', async () => {
      const customer = {
        ...TestData.customer,
        document: TestData.generateUniqueCpf(),
        email: `customer${Date.now()}@example.com`,
      };

      const response = await api.post('/api/admin/customers', customer);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(customer.name);
      expect(response.body.documentType).toBe('CPF');

      createdCustomerId = response.body.id;
    });

    it('should create a customer with CNPJ', async () => {
      const company = {
        ...TestData.companyCustomer,
        email: `company${Date.now()}@example.com`,
      };

      const response = await api.post('/api/admin/customers', company);

      expect(response.status).toBe(201);
      expect(response.body.documentType).toBe('CNPJ');
    });

    it('should fail with invalid document', async () => {
      const response = await api.post('/api/admin/customers', {
        ...TestData.customer,
        document: '11111111111',
        email: `invalid${Date.now()}@example.com`,
      });

      expect(response.status).toBe(400);
    });

    it('should fail with duplicate document', async () => {
      const customer = {
        ...TestData.customer,
        email: `duplicate${Date.now()}@example.com`,
      };

      // First creation
      await api.post('/api/admin/customers', customer);

      // Duplicate attempt
      const response = await api.post('/api/admin/customers', {
        ...customer,
        email: `duplicate2${Date.now()}@example.com`,
      });

      expect(response.status).toBe(409);
    });

    it('should fail with invalid email', async () => {
      const response = await api.post('/api/admin/customers', {
        ...TestData.customer,
        document: TestData.generateUniqueCpf(),
        email: 'invalid-email',
      });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await api.post(
        '/api/admin/customers',
        TestData.customer,
        false,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/customers', () => {
    it('should list all customers with pagination', async () => {
      const response = await api.get('/api/admin/customers?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should respect pagination parameters', async () => {
      const response = await api.get('/api/admin/customers?page=1&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/admin/customers/:id', () => {
    it('should get customer by id', async () => {
      const response = await api.get(
        `/api/admin/customers/${createdCustomerId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdCustomerId);
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api.get(`/api/admin/customers/${fakeId}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await api.get('/api/admin/customers/invalid-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/customers/:id', () => {
    it('should update customer name', async () => {
      const response = await api.put(
        `/api/admin/customers/${createdCustomerId}`,
        { name: 'Nome Atualizado' },
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Nome Atualizado');
    });

    it('should update customer phone', async () => {
      const response = await api.put(
        `/api/admin/customers/${createdCustomerId}`,
        { phone: '11777777777' },
      );

      expect(response.status).toBe(200);
      expect(response.body.phone).toBe('11777777777');
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api.put(`/api/admin/customers/${fakeId}`, {
        name: 'Test',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/customers/document/:document', () => {
    it('should find customer by document', async () => {
      // First create a customer with known document
      const customer = {
        document: '52998224725',
        name: 'Busca por Documento',
        email: `doctest${Date.now()}@example.com`,
        phone: '11999999999',
      };

      await api.post('/api/admin/customers', customer);

      const response = await api.get(
        `/api/admin/customers/document/${customer.document}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.document).toBe(customer.document);
    });

    it('should return 400 for invalid document format', async () => {
      // Invalid CPF format (all zeros)
      const response = await api.get(
        '/api/admin/customers/document/00000000000',
      );

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/customers/:id', () => {
    it('should soft delete a customer', async () => {
      // Create a customer to delete
      const customer = {
        document: TestData.generateUniqueCpf(),
        name: 'Para Deletar',
        email: `delete${Date.now()}@example.com`,
        phone: '11999999999',
      };

      const createResponse = await api.post('/api/admin/customers', customer);
      const deleteId = createResponse.body.id;

      const response = await api.delete(`/api/admin/customers/${deleteId}`);

      expect(response.status).toBe(204);

      // Verify customer is not accessible anymore
      const getResponse = await api.get(`/api/admin/customers/${deleteId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
