import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { VersionController } from '../utils/version/version.controller';
import DatabaseService from './services/database.service';
import MattermostNotificationService from './services/mattermost-notification.service';
import SupabaseService from './services/supabase.service';

@Module({
  imports: [ConfigurationModule],
  providers: [DatabaseService, MattermostNotificationService, SupabaseService],
  exports: [DatabaseService, MattermostNotificationService, SupabaseService],
  controllers: [VersionController],
})
export class CommonModule {}
