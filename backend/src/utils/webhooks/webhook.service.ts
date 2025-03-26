import { ApplicationSousScopesType } from '@/backend/utils/application-domains.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from '../bullmq/queue-names.constants';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectQueue(WEBHOOK_NOTIFICATIONS_QUEUE_NAME)
    private readonly webhookNotifications: Queue
  ) {}

  async sendWebhookNotification(type: ApplicationSousScopesType, payload: any) {
    this.logger.log(
      `Sending ${type} webhook notification: ${JSON.stringify(payload)}`
    );

    await this.webhookNotifications.add(type, payload);
  }
}
