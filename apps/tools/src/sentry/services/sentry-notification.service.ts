import { Injectable, Logger } from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import MattermostNotificationService from '../../utils/mattermost-notification.service';
import { SentryEventWebhookPayload } from '../models/SentryEventWebhookPayload';

@Injectable()
export class SentryNotificationService {
  private readonly logger = new Logger(SentryNotificationService.name);

  constructor(
    private readonly mattermostNotificationService: MattermostNotificationService
  ) {}

  async handleErrorAlert(body: SentryEventWebhookPayload) {
    const errorMessage = body.event?.exception?.values?.length
      ? body.event?.exception?.values[0]?.value
      : undefined;

    if (errorMessage) {
      const message = `:no_entry: ${body.level}: ${errorMessage} sur l'environnement ${process.env.ENV_NAME} ([erreur](${body.url})).`;
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
