import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { VersionController } from './controllers/version.controller';
import DatabaseService from './services/database.service';
import MattermostNotificationService from './services/mattermost-notification.service';

@Module({
  imports: [ConfigurationModule],
  providers: [DatabaseService, MattermostNotificationService],
  exports: [DatabaseService, MattermostNotificationService],
  controllers: [VersionController],
})
export class CommonModule {}
