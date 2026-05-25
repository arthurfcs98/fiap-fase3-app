import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  INotificationService,
  StatusChangeNotification,
} from '../../domain/services/notification.service.interface';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
  ) {}

  async notifyStatusChange(notification: StatusChangeNotification): Promise<void> {
    await this.notificationQueue.add('status-change', notification, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    });

    this.logger.log(
      `Queued status change notification for order ${notification.orderNumber} → ${notification.newStatus}`,
    );
  }
}
