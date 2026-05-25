import { StatusChangeNotification } from './notification.service.interface';

export interface IEmailService {
  sendStatusChangeEmail(
    notification: StatusChangeNotification,
    token: string,
  ): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('IEmailService');
