import { Global, Module } from '@nestjs/common';
import VersionService from '@tet/backend/utils/version/version.service';
import { ContextStoreService } from './context/context.service';
import { CsvService } from './csv/csv.service';
import MattermostNotificationService from './mattermost-notification.service';
import { ArchiveAssemblyService } from './archive/archive-assembly.service';
import { DocumentStorageService } from './supabase/document-storage.service';
import { VersionController } from './version/version.controller';
import { WebhookModule } from './webhooks/webhook.module';

@Global()
@Module({
  imports: [WebhookModule],
  providers: [
    ContextStoreService,
    CsvService,
    MattermostNotificationService,
    VersionService,
    ArchiveAssemblyService,
    DocumentStorageService,
  ],
  exports: [
    WebhookModule,
    ContextStoreService,
    CsvService,
    MattermostNotificationService,
    VersionService,
    ArchiveAssemblyService,
    DocumentStorageService,
  ],
  controllers: [VersionController],
})
export class UtilsModule {}
