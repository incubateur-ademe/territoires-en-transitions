import { ContextStoreService } from '@/backend/utils/context/context.service';
import { VersionController } from '@/backend/utils/version/version.controller';
import VersionService from '@/backend/utils/version/version.service';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import MattermostNotificationService from './mattermost-notification.service';
import { TrpcClientService } from './trpc/trpc-client.service';

@Module({
  imports: [ConfigurationModule],
  controllers: [VersionController],
  providers: [
    VersionService,
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
