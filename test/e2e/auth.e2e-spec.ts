import { INestApplication } from '@nestjs/common';
import { TestApp, ApiClient, TestData } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(async () => {
    app = await TestApp.getInstance();
    api = new ApiClient(app);
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid admin credentials', async () => {
      const response = await api.post(
        '/api/auth/login',
        TestData.admin,
        false,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(TestData.admin.email);

      TestApp.setAccessToken(response.body.accessToken);
    });

    it('should fail with invalid password', async () => {
      const response = await api.post(
        '/api/auth/login',
        {
          email: TestData.admin.email,
          password: 'wrongpassword',
        },
        false,
      );

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const response = await api.post(
        '/api/auth/login',
        {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
        false,
      );

      expect(response.status).toBe(401);
    });

    it('should fail with invalid email format', async () => {
      const response = await api.post(
        '/api/auth/login',
        {
          email: 'invalid-email',
          password: 'password123',
        },
        false,
      );

      expect(response.status).toBe(400);
    });

    it('should fail with empty credentials', async () => {
      const response = await api.post('/api/auth/login', {}, false);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
      };

      const response = await api.post('/api/auth/register', newUser, false);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(newUser.email);
    });

    it('should fail to register with existing email', async () => {
      const response = await api.post(
        '/api/auth/register',
        {
          email: TestData.admin.email,
          password: 'password123',
          name: 'Duplicate User',
        },
        false,
      );

      expect(response.status).toBe(409);
    });

    it('should fail with weak password', async () => {
      const response = await api.post(
        '/api/auth/register',
        {
          email: 'weak@example.com',
          password: '123',
          name: 'Weak Password User',
        },
        false,
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Protected routes', () => {
    it('should deny access to protected routes without token', async () => {
      const response = await api.get('/api/admin/customers?page=1&limit=10', false);

      expect(response.status).toBe(401);
    });

    it('should deny access with invalid token', async () => {
      const originalToken = TestApp.getAccessToken();
      TestApp.setAccessToken('invalid-token');

      const response = await api.get('/api/admin/customers?page=1&limit=10', true);

      expect(response.status).toBe(401);

      TestApp.setAccessToken(originalToken);
    });

    it('should allow access to protected routes with valid token', async () => {
      const response = await api.get('/api/admin/customers?page=1&limit=10', true);

      expect(response.status).toBe(200);
    });
  });
});
