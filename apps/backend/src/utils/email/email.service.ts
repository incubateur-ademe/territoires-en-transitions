import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { Result } from '@tet/backend/utils/result.type';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

type Email = {
  to: string;
  subject: string;
  html: string;
};

type SMTPOptions = SMTPTransport['options'];

// configuration pour le dev et les tests
const DEV_CONFIG: SMTPOptions = {
  host: '127.0.0.1',
  port: 54325,
  secure: false,
  requireTLS: false,
  tls: {
    rejectUnauthorized: false,
  },
} as const;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configurationService: ConfigurationService) {}

  /**
   * Envoi un email HTML
   */
  async sendEmail(email: Email): Promise<
    Result<
      { messageId: string },
      {
        messageId: string | null;
        status: 'pending' | 'rejected' | 'unknown' | 'not-whitelisted';
        errorMessage: string;
      }
    >
  > {
    const smtpToEmailWhitelist = this.configurationService.get(
      'SMTP_TO_EMAIL_WHITELIST'
    );
    if (smtpToEmailWhitelist && !smtpToEmailWhitelist.includes(email.to)) {
      this.logger.log(
        `Email ${
          email.to
        } not whitelisted (whitelist: ${smtpToEmailWhitelist.join(', ')})`
      );
      return {
        success: false,
        error: {
          status: 'not-whitelisted',
          messageId: null,
          errorMessage: 'Email not whitelisted',
        },
      };
    }

    const transporter = this.getTransport();
    try {
      const info = await transporter.sendMail({
        ...email,
        from: this.configurationService.get('SMTP_FROM'),
      });
      if (info.accepted.includes(email.to)) {
        return {
          success: true,
          data: { messageId: info.messageId },
        };
      }
      // info.pending: addresses that received a temporary failure
      const isPending = info.pending.includes(email.to);
      const status = isPending
        ? 'pending'
        : info.rejected.includes(email.to)
        ? 'rejected'
        : 'unknown';

      const errorMessage = `sendEmail error: messageId ${info.messageId}, status ${status}`;
      this.logger.log(errorMessage);
      return {
        success: false,
        error: { status, messageId: info.messageId, errorMessage },
      };
    } catch (error) {
      // Gère les exceptions levées par nodemailer (par exemple quand RCPT TO est rejeté)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const status = this.determineStatusFromError(errorMessage);
      const messageId = `error-${Date.now()}`;

      const finalErrorMessage = `sendEmail error: messageId ${messageId}, status ${status}`;
      this.logger.log(finalErrorMessage);
      return {
        success: false,
        error: { status, messageId, errorMessage: finalErrorMessage },
      };
    }
  }

  /**
   * Détermine le statut d'erreur à partir du message d'erreur SMTP
   */
  private determineStatusFromError(
    errorMessage: string
  ): 'pending' | 'rejected' | 'unknown' {
    // Les codes SMTP 4xx indiquent une erreur temporaire (pending)
    if (/\b4\d{2}\b/.test(errorMessage)) {
      return 'pending';
    }
    // Les codes SMTP 5xx indiquent un rejet permanent (rejected)
    if (/\b5\d{2}\b/.test(errorMessage)) {
      return 'rejected';
    }
    // Par défaut, on considère que c'est un rejet permanent si le message contient certains mots-clés
    const rejectedKeywords = ['reject', 'unavailable', 'invalid', 'permanent'];
    if (
      rejectedKeywords.some((keyword) =>
        errorMessage.toLowerCase().includes(keyword)
      )
    ) {
      return 'rejected';
    }
    // Sinon, c'est un statut unknown
    return 'unknown';
  }

  /**
   * Charge et vérifie la configuration
   */
  private getConfig(): Result<SMTPOptions, string> {
    const url = this.configurationService.get('SMTP_URL');
    const pass = this.configurationService.get('SMTP_KEY');
    if (!url || !pass) {
      return { success: false, error: `Config SMTP manquante` };
    }
    try {
      const { username, hostname, port } = new URL(url);
      const portNumber = parseInt(port);
      if (!username || !hostname || (port && isNaN(portNumber))) {
        return { success: false, error: 'Config SMTP non valide' };
      }

      return {
        success: true,
        data: {
          host: hostname,
          port: portNumber,
          secure: false,
          auth: { user: decodeURIComponent(username), pass },
        },
      } as const;
    } catch (error) {
      return {
        success: false,
        error: `Config SMTP non valide ${error}`,
      };
    }
  }

  /**
   * Fourni le transporteur de mails
   */
  private getTransport() {
    const config = this.getConfig();
    if (!config.success) {
      const { error } = config;
      if (process.env.NODE_ENV === 'production') {
        throw Error(error);
      }
      this.logger.log(error);
      return nodemailer.createTransport(DEV_CONFIG);
    }
    return nodemailer.createTransport(config.data);
  }
}
