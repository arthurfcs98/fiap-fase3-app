import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Vehicle (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;
  let customerId: string;
  let vehicleId: string;

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

    // Create a customer for vehicle tests
    const customerResponse = await api.post('/api/admin/customers', {
      document: TestData.generateUniqueCpf(),
      name: 'Cliente para Veículos',
      email: `vehiclecust${Date.now()}@example.com`,
      phone: '11999999999',
    });
    customerId = customerResponse.body.id;
  });

  describe('POST /api/admin/vehicles', () => {
    it('should create a vehicle for existing customer', async () => {
      const vehicle = {
        ...TestData.vehicle,
        licensePlate: TestData.generateUniquePlate(),
        customerId,
      };

      const response = await api.post('/api/admin/vehicles', vehicle);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.brand).toBe(vehicle.brand);
      expect(response.body.model).toBe(vehicle.model);
      expect(response.body.customerId).toBe(customerId);

      vehicleId = response.body.id;
    });

    it('should fail with invalid license plate format', async () => {
      const response = await api.post('/api/admin/vehicles', {
        ...TestData.vehicle,
        licensePlate: 'INVALID',
        customerId,
      });

      expect(response.status).toBe(400);
    });

    it('should fail with non-existent customer', async () => {
      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';
      const response = await api.post('/api/admin/vehicles', {
        ...TestData.vehicle,
        licensePlate: TestData.generateUniquePlate(),
        customerId: fakeCustomerId,
      });

      expect(response.status).toBe(404);
    });

    it('should fail with duplicate license plate', async () => {
      const plate = TestData.generateUniquePlate();

      // First vehicle
      await api.post('/api/admin/vehicles', {
        ...TestData.vehicle,
        licensePlate: plate,
        customerId,
      });

      // Duplicate plate
      const response = await api.post('/api/admin/vehicles', {
        ...TestData.vehicle2,
        licensePlate: plate,
        customerId,
      });

      expect(response.status).toBe(409);
    });

    it('should fail without authentication', async () => {
      const response = await api.post(
        '/api/admin/vehicles',
        { ...TestData.vehicle, customerId },
        false,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/vehicles', () => {
    it('should list all vehicles with pagination', async () => {
      const response = await api.get('/api/admin/vehicles?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/admin/vehicles/:id', () => {
    it('should get vehicle by id', async () => {
      const response = await api.get(`/api/admin/vehicles/${vehicleId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vehicleId);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api.get(`/api/admin/vehicles/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/vehicles/plate/:licensePlate', () => {
    it('should find vehicle by license plate', async () => {
      const plate = TestData.generateUniquePlate();

      // Create vehicle with known plate
      await api.post('/api/admin/vehicles', {
        ...TestData.vehicle,
        licensePlate: plate,
        customerId,
      });

      const response = await api.get(`/api/admin/vehicles/plate/${plate}`);

      expect(response.status).toBe(200);
      expect(response.body.licensePlate).toBe(plate);
    });

    it('should return 404 for non-existent plate', async () => {
      const response = await api.get('/api/admin/vehicles/plate/ZZZ0000');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/vehicles/customer/:customerId', () => {
    it('should list vehicles by customer', async () => {
      const response = await api.get(
        `/api/admin/vehicles/customer/${customerId}`,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].customerId).toBe(customerId);
    });

    it('should return empty array for customer without vehicles', async () => {
      // Create a new customer without vehicles
      const newCustomer = await api.post('/api/admin/customers', {
        document: TestData.generateUniqueCpf(),
        name: 'Sem Veículos',
        email: `novehicles${Date.now()}@example.com`,
        phone: '11999999999',
      });

      const response = await api.get(
        `/api/admin/vehicles/customer/${newCustomer.body.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('PUT /api/admin/vehicles/:id', () => {
    it('should update vehicle color', async () => {
      const response = await api.put(`/api/admin/vehicles/${vehicleId}`, {
        color: 'Azul',
      });

      expect(response.status).toBe(200);
      expect(response.body.color).toBe('Azul');
    });

    it('should update vehicle year', async () => {
      const response = await api.put(`/api/admin/vehicles/${vehicleId}`, {
        year: 2023,
      });

      expect(response.status).toBe(200);
      expect(response.body.year).toBe(2023);
    });

    it('should fail when updating to existing license plate', async () => {
      const existingPlate = TestData.generateUniquePlate();

      // Create another vehicle
      await api.post('/api/admin/vehicles', {
        ...TestData.vehicle2,
        licensePlate: existingPlate,
        customerId,
      });

      // Try to update to existing plate
      const response = await api.put(`/api/admin/vehicles/${vehicleId}`, {
        licensePlate: existingPlate,
      });

      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /api/admin/vehicles/:id', () => {
    it('should soft delete a vehicle', async () => {
      // Create vehicle to delete
      const createResponse = await api.post('/api/admin/vehicles', {
        ...TestData.vehicle,
        licensePlate: TestData.generateUniquePlate(),
        customerId,
      });
      const deleteId = createResponse.body.id;

      const response = await api.delete(`/api/admin/vehicles/${deleteId}`);

      expect(response.status).toBe(204);

      // Verify vehicle is not accessible
      const getResponse = await api.get(`/api/admin/vehicles/${deleteId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
