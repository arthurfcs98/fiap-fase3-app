import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { StatusChangeNotification } from '../../domain/services/notification.service.interface';
import { IEmailService } from '../../domain/services/email.service.interface';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<number>('SMTP_PORT', 587) === 465,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
      this.logger.log(`Email transport configured with host: ${host}`);
    } else {
      this.logger.warn('SMTP_HOST not configured - emails will be logged only');
    }
  }

  async sendStatusChangeEmail(
    notification: StatusChangeNotification,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const orderUrl = `${frontendUrl}/orders?token=${token}&orderNumber=${notification.orderNumber}`;

    const isAwaitingApproval = notification.newStatus === 'AWAITING_APPROVAL';

    const subject = isAwaitingApproval
      ? `Orçamento disponível - OS ${notification.orderNumber}`
      : `Atualização da OS ${notification.orderNumber} - ${notification.newStatusLabel}`;

    const html = this.buildEmailHtml(notification, orderUrl, isAwaitingApproval);

    if (!this.transporter) {
      this.logger.log(`[EMAIL MOCK] To: ${notification.customerEmail}`);
      this.logger.log(`[EMAIL MOCK] Subject: ${subject}`);
      this.logger.log(`[EMAIL MOCK] Order URL: ${orderUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM', 'oficina@example.com'),
      to: notification.customerEmail,
      subject,
      html,
    });

    this.logger.log(`Email sent to ${notification.customerEmail} for order ${notification.orderNumber}`);
  }

  private buildEmailHtml(
    notification: StatusChangeNotification,
    orderUrl: string,
    isAwaitingApproval: boolean,
  ): string {
    const approvalButtons = isAwaitingApproval
      ? `
        <div style="margin: 24px 0; text-align: center;">
          <p style="margin-bottom: 16px; font-size: 16px;">Acesse o link abaixo para visualizar o orçamento e aprovar ou rejeitar:</p>
          <a href="${orderUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Ver Orçamento
          </a>
        </div>`
      : `
        <div style="margin: 24px 0; text-align: center;">
          <a href="${orderUrl}" style="display: inline-block; padding: 12px 28px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
            Acompanhar OS
          </a>
        </div>`;

    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
        <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Oficina Mecânica</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p>Olá, <strong>${notification.customerName}</strong>!</p>

          <p>${isAwaitingApproval
            ? 'O orçamento da sua ordem de serviço está pronto para aprovação.'
            : `Sua ordem de serviço teve o status atualizado para: <strong>${notification.newStatusLabel}</strong>.`
          }</p>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Nº da OS</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${notification.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Veículo</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${notification.vehicleDescription}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Status</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="display: inline-block; padding: 4px 12px; background-color: ${isAwaitingApproval ? '#fef3c7' : '#dbeafe'}; color: ${isAwaitingApproval ? '#92400e' : '#1e40af'}; border-radius: 12px; font-size: 13px; font-weight: 500;">
                  ${notification.newStatusLabel}
                </span>
              </td>
            </tr>
          </table>

          ${approvalButtons}

          <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
            Este link é válido por 48 horas. Caso expire, acesse a página e informe seu CPF/CNPJ e o número da OS.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}
