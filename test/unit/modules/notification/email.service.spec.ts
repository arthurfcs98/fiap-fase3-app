import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@/modules/notification/infrastructure/services/email.service';
import { StatusChangeNotification } from '@/modules/notification/domain/services/notification.service.interface';

// Mock nodemailer - use inline fn since jest.mock is hoisted
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg-123' });
jest.mock('nodemailer', () => {
  return {
    __esModule: true,
    default: { createTransport: jest.fn() },
    createTransport: jest.fn(),
  };
});

// Set up mock after hoisting
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailer = require('nodemailer');
  nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
});

describe('EmailService', () => {
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

  describe('with SMTP configured', () => {
    let service: EmailService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                const config: Record<string, any> = {
                  SMTP_HOST: 'smtp.test.com',
                  SMTP_PORT: 587,
                  SMTP_USER: 'user',
                  SMTP_PASS: 'pass',
                  SMTP_FROM: 'test@test.com',
                  FRONTEND_URL: 'http://localhost:3000',
                };
                return config[key] ?? defaultValue;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should send email via SMTP for awaiting approval', async () => {
      await service.sendStatusChangeEmail(notification, 'test-token');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@test.com',
          subject: expect.stringContaining('OS-2024-00001'),
        }),
      );
    });

    it('should send email via SMTP for regular status update', async () => {
      const update = { ...notification, newStatus: 'COMPLETED', newStatusLabel: 'Finalizada' };
      await service.sendStatusChangeEmail(update, 'test-token');

      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe('without SMTP configured (mock mode)', () => {
    let service: EmailService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
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

      service = module.get<EmailService>(EmailService);
    });

    it('should log instead of sending when no SMTP host', async () => {
      await service.sendStatusChangeEmail(notification, 'test-token');
      // Should not throw
    });
  });
});
