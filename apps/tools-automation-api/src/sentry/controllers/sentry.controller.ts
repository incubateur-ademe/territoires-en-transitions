import { SentryEventWebhookPayload } from '@/tools-automation-api/sentry/models/SentryEventWebhookPayload';
import { Body, Controller, Logger, Post } from '@nestjs/common';
import { SentryService } from '../services/sentry.service';

@Controller('sentry')
export class SentryController {
  private readonly logger = new Logger(SentryService.name);

  constructor(private readonly sentryService: SentryService) {}

  @Post('errors/callback')
  async handleErrorAlert(@Body() body: SentryEventWebhookPayload) {
    this.logger.log('Received error alert from Datadog');

    await this.sentryService.handleErrorAlert(body);
  }
}
