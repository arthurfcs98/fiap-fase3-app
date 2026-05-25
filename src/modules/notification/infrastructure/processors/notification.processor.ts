import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StatusChangeNotification } from '../../domain/services/notification.service.interface';
import { IEmailService, EMAIL_SERVICE } from '../../domain/services/email.service.interface';
import { TokenService } from '../services/token.service';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @Inject(EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    private readonly tokenService: TokenService,
  ) {
    super();
  }

  async process(job: Job<StatusChangeNotification>): Promise<void> {
    const notification = job.data;

    this.logger.log(
      `Processing notification for order ${notification.orderNumber} → ${notification.newStatus}`,
    );

    const token = this.tokenService.generateCustomerToken(
      notification.orderNumber,
      notification.customerId,
    );

    await this.emailService.sendStatusChangeEmail(notification, token);

    this.logger.log(
      `Notification processed for order ${notification.orderNumber}`,
    );
  }
}
