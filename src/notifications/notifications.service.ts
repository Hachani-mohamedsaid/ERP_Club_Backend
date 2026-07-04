import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendEmail(to: string, subject: string, body: string): Promise<{ sent: boolean; reason?: string }> {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASSWORD')?.trim();
    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const fromEmail =
      this.config.get<string>('SMTP_FROM_EMAIL')?.trim() ||
      this.config.get<string>('SMTP_USER')?.trim() ||
      'noreply@odin.erp';
    const fromName = this.config.get<string>('SMTP_FROM_NAME', 'ODIN ERP');

    if (!host || !user || !pass) {
      this.logger.warn(`Email not sent (SMTP not configured): ${subject} → ${to}`);
      return { sent: false, reason: 'smtp_not_configured' };
    }

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text: body,
        html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
      });

      return { sent: true };
    } catch (err) {
      this.logger.error(`Email send failed: ${err instanceof Error ? err.message : err}`);
      return { sent: false, reason: 'send_failed' };
    }
  }
}
