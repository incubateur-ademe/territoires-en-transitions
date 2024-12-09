import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { VersionController } from './controllers/version.controller';
import { DatabaseService } from './services/database.service';
import { MattermostNotificationService } from './services/mattermost-notification.service';
import { SupabaseService } from './services/supabase.service';

@Module({
  imports: [ConfigModule],
  providers: [DatabaseService, MattermostNotificationService, SupabaseService],
  exports: [DatabaseService, MattermostNotificationService, SupabaseService],
  controllers: [VersionController],
})
export class CommonModule {}
