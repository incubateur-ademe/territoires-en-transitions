import { SentryEventWebhookPayload } from '@/tools/sentry/models/SentryEventWebhookPayload';
import { Body, Controller, Logger, Post } from '@nestjs/common';
import { SentryNotificationService } from '../services/sentry-notification.service';

@Controller('sentry')
export class SentryNotificationController {
  private readonly logger = new Logger(SentryNotificationController.name);

  constructor(
    private readonly sentryNotificationService: SentryNotificationService
  ) {}

  @Post('errors/callback')
  async handleErrorAlert(@Body() body: SentryEventWebhookPayload) {
    this.logger.log('Received error alert from Datadog');

    await this.sentryNotificationService.handleErrorAlert(body);
  }
}
