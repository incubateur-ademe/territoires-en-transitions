import { ContextStoreService } from '@/backend/utils/context/context.service';
import { VersionController } from '@/backend/utils/version/version.controller';
import { Module } from '@nestjs/common';
import MattermostNotificationService from 'apps/tools-automation-api/src/utils/mattermost-notification.service';
import { ConfigurationModule } from '../config/configuration.module';
import { TrpcClientService } from './trpc/trpc-client.service';

@Module({
  imports: [ConfigurationModule],
  controllers: [VersionController],
  providers: [
    TrpcClientService,
    MattermostNotificationService,
    ContextStoreService,
  ],
  exports: [
    TrpcClientService,
    MattermostNotificationService,
    ContextStoreService,
  ],
})
export class UtilsModule {}
