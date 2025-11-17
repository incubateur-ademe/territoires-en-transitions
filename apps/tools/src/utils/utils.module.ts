import { ContextStoreService } from '@/backend/utils/context/context.service';
import { VersionController } from '@/backend/utils/version/version.controller';
import VersionService from '@/backend/utils/version/version.service';
import MattermostNotificationService from './mattermost-notification.service';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { TrpcClientService } from './trpc/trpc-client.service';

@Module({
  imports: [ConfigurationModule],
  controllers: [VersionController],
  providers: [
    TrpcClientService,
    MattermostNotificationService,
    ContextStoreService,
    VersionService,
  ],
  exports: [
    TrpcClientService,
    MattermostNotificationService,
    ContextStoreService,
  ],
})
export class UtilsModule {}
