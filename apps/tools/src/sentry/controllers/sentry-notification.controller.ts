import { Body, Controller, Logger, Post } from '@nestjs/common';
import type { SentryEventWebhookPayload } from '../models/SentryEventWebhookPayload';
import { SentryNotificationService } from '../services/sentry-notification.service';

@Controller('sentry')
export class SentryNotificationController {
  private readonly logger = new Logger(SentryNotificationController.name);

  constructor(
    private readonly sentryNotificationService: SentryNotificationService
  ) {}

  @Post('errors/callback')
  async handleErrorAlert(@Body() body: SentryEventWebhookPayload) {
    this.logger.log('Received error alert from Sentry');

    await this.sentryNotificationService.handleErrorAlert(body);
  }
}
