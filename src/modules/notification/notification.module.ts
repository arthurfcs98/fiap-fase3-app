import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { JwtModule } from '@nestjs/jwt';
import { NOTIFICATION_SERVICE } from './domain/services/notification.service.interface';
import { EMAIL_SERVICE } from './domain/services/email.service.interface';
import { NotificationService } from './infrastructure/services/notification.service';
import { ResendEmailService } from './infrastructure/services/resend-email.service';
import { TokenService } from './infrastructure/services/token.service';
import { NotificationProcessor } from './infrastructure/processors/notification.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    BullBoardModule.forFeature({
      name: 'notifications',
      adapter: BullMQAdapter,
    }),
    JwtModule.register({}),
  ],
  providers: [
    {
      provide: NOTIFICATION_SERVICE,
      useClass: NotificationService,
    },
    {
      provide: EMAIL_SERVICE,
      useClass: ResendEmailService,
    },
    TokenService,
    NotificationProcessor,
  ],
  exports: [NOTIFICATION_SERVICE, TokenService],
})
export class NotificationModule {}
