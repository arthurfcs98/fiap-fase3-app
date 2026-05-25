import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationService } from '@/modules/notification/infrastructure/services/notification.service';
import { StatusChangeNotification } from '@/modules/notification/domain/services/notification.service.interface';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('notifyStatusChange', () => {
    const notification: StatusChangeNotification = {
      orderNumber: 'OS-2024-00001',
      customerName: 'John Doe',
      customerEmail: 'john@test.com',
      vehicleDescription: 'Toyota Corolla',
      previousStatus: 'RECEIVED',
      newStatus: 'IN_DIAGNOSIS',
      newStatusLabel: 'Em Diagnóstico',
      customerId: 'customer-uuid',
    };

    it('should add job to the notification queue', async () => {
      await service.notifyStatusChange(notification);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'status-change',
        notification,
        expect.objectContaining({
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        }),
      );
    });

    it('should configure retry with 3 attempts', async () => {
      await service.notifyStatusChange(notification);

      const jobOptions = mockQueue.add.mock.calls[0][2];
      expect(jobOptions.attempts).toBe(3);
      expect(jobOptions.backoff.type).toBe('exponential');
    });
  });
});
