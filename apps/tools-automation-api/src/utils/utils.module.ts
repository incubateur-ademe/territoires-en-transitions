import { Module } from '@nestjs/common';
import MattermostNotificationService from 'apps/tools-automation-api/src/utils/mattermost-notification.service';
import { ConfigurationModule } from '../config/configuration.module';
import { TrpcClientService } from './trpc/trpc-client.service';
import { VersionController } from './version/version.controller';

@Module({
  imports: [ConfigurationModule],
  controllers: [VersionController],
  providers: [TrpcClientService, MattermostNotificationService],
  exports: [TrpcClientService, MattermostNotificationService],
})
export class UtilsModule {}
