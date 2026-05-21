import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import VersionService from '@tet/backend/utils/version/version.service';
import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from './bullmq/queue-names.constants';
import { ContextStoreService } from './context/context.service';
import { CsvService } from './csv/csv.service';
import MattermostNotificationService from './mattermost-notification.service';
import { DocumentStorageService } from './supabase/document-storage.service';
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
    CsvService,
    MattermostNotificationService,
    WebhookService,
    VersionService,
    DocumentStorageService,
  ],
  exports: [
    ContextStoreService,
    CsvService,
    MattermostNotificationService,
    WebhookService,
    VersionService,
    DocumentStorageService,
  ],
  controllers: [VersionController],
})
export class UtilsModule {}
