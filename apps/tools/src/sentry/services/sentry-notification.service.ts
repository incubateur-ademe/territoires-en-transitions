import { getErrorMessage } from '@/backend/utils/get-error-message';
import { SentryEventWebhookPayload } from '@/tools/sentry/models/SentryEventWebhookPayload';
import MattermostNotificationService from '@/tools/utils/mattermost-notification.service';
import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import ConfigurationService from '../../config/configuration.service';

@Injectable()
export class SentryNotificationService {
  private readonly logger = new Logger(SentryNotificationService.name);

  private readonly DATADOG_URL = 'https://app.datadoghq.eu/logs';
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly mattermostNotificationService: MattermostNotificationService
  ) {}

  async handleErrorAlert(body: SentryEventWebhookPayload) {
    const traceId = body.event?.contexts?.trace?.trace_id || '';
    const errorMessage = body.event?.exception?.values?.length
      ? body.event?.exception?.values[0]?.value
      : undefined;

    if (errorMessage) {
      const dateTime = DateTime.fromMillis((body.event.timestamp || 0) * 1000);
      const fromTs = dateTime.minus({ hour: 1 }).toMillis();
      const message = `:no_entry: ${
        body.level
      }: ${errorMessage} sur l'environnement ${
        process.env.ENV_NAME
      } ([erreur](${body.url}), [logs](${
        this.DATADOG_URL
      }?query=${`%40trace_id%3A${traceId}&from_ts=${fromTs}`})).`;
      this.logger.log(`Sending notification to Mattermost: ${message}`);
      try {
        await this.mattermostNotificationService.postMessage(message);
      } catch (error) {
        this.logger.error(
          `Error sending notification to Mattermost: ${getErrorMessage(error)}`
        );
      }
    } else {
      this.logger.warn(
        `No error message found in the Sentry event webhook payload`
      );
      this.logger.warn(JSON.stringify(body));
    }
  }
}
