import { NotificationProcessor } from '@/modules/notification/infrastructure/processors/notification.processor';
import { StatusChangeNotification } from '@/modules/notification/domain/services/notification.service.interface';
import { Job } from 'bullmq';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;

  const mockEmailService = {
    sendStatusChangeEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockTokenService = {
    generateCustomerToken: jest.fn().mockReturnValue('mock-token-123'),
  };

  beforeEach(() => {
    processor = new NotificationProcessor(
      mockEmailService as any,
      mockTokenService as any,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    const notification: StatusChangeNotification = {
      orderNumber: 'OS-2024-00001',
      customerName: 'John Doe',
      customerEmail: 'john@test.com',
      vehicleDescription: 'Toyota Corolla',
      previousStatus: 'RECEIVED',
      newStatus: 'AWAITING_APPROVAL',
      newStatusLabel: 'Aguardando Aprovação',
      customerId: 'customer-uuid',
    };

    const mockJob = { data: notification } as Job<StatusChangeNotification>;

    it('should generate customer token and send email', async () => {
      await processor.process(mockJob);

      expect(mockTokenService.generateCustomerToken).toHaveBeenCalledWith(
        'OS-2024-00001',
        'customer-uuid',
      );

      expect(mockEmailService.sendStatusChangeEmail).toHaveBeenCalledWith(
        notification,
        'mock-token-123',
      );
    });

    it('should pass the generated token to email service', async () => {
      mockTokenService.generateCustomerToken.mockReturnValue('specific-token');

      await processor.process(mockJob);

      expect(mockEmailService.sendStatusChangeEmail).toHaveBeenCalledWith(
        notification,
        'specific-token',
      );
    });
  });
});
