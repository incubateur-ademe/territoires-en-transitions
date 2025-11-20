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
  ) {
    this.logger.log(
      `Sending ${type} webhook notification for entity ${entityId}`
    );
    const configurations = await this.getWebhookConfigurations(type);
    if (!configurations.length) {
      this.logger.log(`No webhook configurations found for type: ${type}`);
    } else {
      this.logger.log(
        `Found ${configurations.length} webhook configurations for type: ${type}`
      );

      const messages: WebhookMessageCreate[] = configurations.map((config) => {
        return {
          status: 'pending',
          entityId: entityId,
          payload: payload,
          configurationRef: config.ref,
        };
      });

      const messagesWithId = await this.databaseService.db
        .insert(webhookMessageTable)
        .values(messages)
        .returning();

      this.logger.log(
        `Adding ${messagesWithId.length} (${messagesWithId
          .map((message) => message.id)
          .join(', ')}) webhook messages to the queue`
      );

      const fullMessages = messagesWithId.map((messageWithId) => ({
        name: type,
        data: messageWithId,
        options: {
          jobId: messageWithId.id,
        },
      }));

      await this.webhookNotifications.addBulk(fullMessages);
    }
  }
}
