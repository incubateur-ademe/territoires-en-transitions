import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  ApplicationSousScopesType,
  WebhookMessageCreate,
} from '@tet/domain/utils';
import { DefaultJobOptions, Queue } from 'bullmq';
import { eq } from 'drizzle-orm';
import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from '../bullmq/queue-names.constants';
import { DatabaseService } from '../database/database.service';
import { webhookConfigurationTable } from './webhook-configuration.table';
import { webhookMessageTable } from './webhook-message.table';

export type WebhookNotificationItem = {
  entityId: string;
  payload: any;
};

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  static MAX_COMPLETED_JOB_TO_KEEP = 1000;

  static DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
    removeOnComplete: WebhookService.MAX_COMPLETED_JOB_TO_KEEP,
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  };

  constructor(
    @InjectQueue(WEBHOOK_NOTIFICATIONS_QUEUE_NAME)
    private readonly webhookNotifications: Queue,
    private readonly databaseService: DatabaseService
  ) {}

  async getWebhookConfigurations(type: ApplicationSousScopesType) {
    return this.databaseService.db
      .select()
      .from(webhookConfigurationTable)
      .where(eq(webhookConfigurationTable.entityType, type));
  }

  async sendWebhookNotification(
    type: ApplicationSousScopesType,
    entityId: string,
    payload: any
  ): Promise<void> {
    this.logger.log(
      `Sending ${type} webhook notification for entity ${entityId}`
    );
    await this.sendWebhookNotifications(type, [{ entityId, payload }]);
  }

  /**
   * Envoie N notifications webhook pour un même type en groupant les ops :
   * 1 SELECT config + 1 bulk INSERT messages + 1 `addBulk` queue.
   * Préserve le contrat externe « 1 message webhook = 1 entité ».
   */
  async sendWebhookNotifications(
    type: ApplicationSousScopesType,
    items: WebhookNotificationItem[]
  ): Promise<void> {
    if (items.length === 0) return;

    const configurations = await this.getWebhookConfigurations(type);
    if (!configurations.length) {
      this.logger.log(`No webhook configurations found for type: ${type}`);
      return;
    }

    this.logger.log(
      `Found ${configurations.length} webhook configurations for type: ${type}, ${items.length} entities to notify`
    );

    const messages: WebhookMessageCreate[] = configurations.flatMap((config) =>
      items.map((item) => ({
        status: 'pending' as const,
        entityId: item.entityId,
        payload: item.payload,
        configurationRef: config.ref,
      }))
    );

    const messagesWithId = await this.databaseService.db
      .insert(webhookMessageTable)
      .values(messages)
      .returning();

    this.logger.log(
      `Adding ${messagesWithId.length} webhook messages to the queue`
    );

    const fullMessages = messagesWithId.map((messageWithId) => ({
      name: type,
      data: messageWithId,
      opts: {
        jobId: messageWithId.id,
      },
    }));

    await this.webhookNotifications.addBulk(fullMessages);
  }
}
