import { Global, Module } from '@nestjs/common';
import MattermostNotificationService from './mattermost-notification.service';
import { VersionController } from './version/version.controller';

@Global()
@Module({
  providers: [MattermostNotificationService],
  exports: [MattermostNotificationService],
  controllers: [VersionController],
})
export class UtilsModule {}
