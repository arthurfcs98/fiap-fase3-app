import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResendEmailService } from '@/modules/notification/infrastructure/services/resend-email.service';
import { StatusChangeNotification } from '@/modules/notification/domain/services/notification.service.interface';

// Mock Resend SDK
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null }),
    },
  })),
}));

describe('ResendEmailService', () => {
  const notification: StatusChangeNotification = {
    orderNumber: 'OS-2024-00001',
    customerName: 'John Doe',
    customerEmail: 'john@test.com',
    vehicleDescription: 'Toyota Corolla',
    previousStatus: 'IN_DIAGNOSIS',
    newStatus: 'AWAITING_APPROVAL',
    newStatusLabel: 'Aguardando Aprovação',
    customerId: 'customer-uuid',
  };

  describe('with API key configured', () => {
    let service: ResendEmailService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ResendEmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                const config: Record<string, any> = {
                  RESEND_API_KEY: 'test-api-key',
                  EMAIL_FROM: 'test@test.com',
                  FRONTEND_URL: 'http://localhost:3000',
                };
                return config[key] ?? defaultValue;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<ResendEmailService>(ResendEmailService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should send email via Resend for awaiting approval', async () => {
      await service.sendStatusChangeEmail(notification, 'test-token');
      // No error means success (Resend mock returns success)
    });

    it('should send email via Resend for status update', async () => {
      const statusUpdate = { ...notification, newStatus: 'IN_PROGRESS', newStatusLabel: 'Em Execução' };
      await service.sendStatusChangeEmail(statusUpdate, 'test-token');
    });

    it('should throw when Resend returns an error', async () => {
      // Override mock to return error
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Resend } = require('resend');
      const instance = new Resend();
      instance.emails.send.mockResolvedValueOnce({
        data: null,
        error: { message: 'Rate limit exceeded', name: 'rate_limit' },
      });

      // Access the internal resend instance via reflection
      (service as any).resend = instance;

      await expect(
        service.sendStatusChangeEmail(notification, 'test-token'),
      ).rejects.toThrow('Resend email failed');
    });
  });

  describe('without API key (mock mode)', () => {
    let service: ResendEmailService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ResendEmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                const config: Record<string, any> = {
                  FRONTEND_URL: 'http://localhost:3000',
                };
                return config[key] ?? defaultValue;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<ResendEmailService>(ResendEmailService);
    });

    it('should log instead of sending when no API key', async () => {
      await service.sendStatusChangeEmail(notification, 'test-token');
      // Should not throw - just logs
    });
  });
});
