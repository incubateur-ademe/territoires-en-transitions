import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from './bullmq/queue-names.constants';
import { ContextStoreService } from './context/context.service';
import MattermostNotificationService from './mattermost-notification.service';
import { VersionController } from './version/version.controller';
import { WebhookService } from './webhooks/webhook.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: WEBHOOK_NOTIFICATIONS_QUEUE_NAME,
      defaultJobOptions: WebhookService.DEFAULT_JOB_OPTIONS,
    }),
  ],
  providers: [
    ContextStoreService,
    MattermostNotificationService,
    WebhookService,
  ],
  exports: [ContextStoreService, MattermostNotificationService, WebhookService],
  controllers: [VersionController],
})
export class UtilsModule {}
