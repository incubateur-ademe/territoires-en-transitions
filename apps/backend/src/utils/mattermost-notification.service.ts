import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from './config/configuration.service';
import { getErrorMessage } from '@/domain/utils';

@Injectable()
export default class MattermostNotificationService {
  private readonly logger = new Logger(MattermostNotificationService.name);

  constructor(private readonly configService: ConfigurationService) {}

  async postMessage(message: string) {
    const mattermostNotificationUrl = this.configService.get(
      'MATTERMOST_NOTIFICATIONS_WEBHOOK_URL'
    );
    if (mattermostNotificationUrl) {
      this.logger.log(`Sending notification to Mattermost: ${message}`);
      try {
        const response = await fetch(mattermostNotificationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: message }),
        });
        if (!response.ok) {
          const responseText = await response.text();
          this.logger.error(
            `Error sending notification to Mattermost: ${responseText}`
          );
        } else {
          this.logger.log(`Notification sent successfully`);
        }
      } catch (error) {
        this.logger.error(
          `Error sending notification to Mattermost: ${getErrorMessage(error)}`
        );
      }
    } else {
      this.logger.log(`Mattermost notifications are not configured, ignoring`);
    }
  }
}
