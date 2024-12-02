import { Global, Module } from '@nestjs/common';
import { ContextStoreService } from './context/context.service';
import MattermostNotificationService from './mattermost-notification.service';
import { VersionController } from './version/version.controller';

@Global()
@Module({
  providers: [ContextStoreService, MattermostNotificationService],
  exports: [ContextStoreService, MattermostNotificationService],
  controllers: [VersionController],
})
export class UtilsModule {}
