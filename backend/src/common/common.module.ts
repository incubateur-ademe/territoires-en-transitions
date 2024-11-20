import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { VersionController } from './controllers/version.controller';
import DatabaseService from './services/database.service';
import SupabaseService from './services/supabase.service';

@Module({
  imports: [ConfigurationModule],
  providers: [DatabaseService, SupabaseService],
  exports: [DatabaseService, SupabaseService],
  controllers: [VersionController],
})
export class CommonModule {}
