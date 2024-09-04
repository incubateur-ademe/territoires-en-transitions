import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VersionController } from './controllers/version.controller';
import BackendConfigurationService from './services/backend-configuration.service';
import DatabaseService from './services/database.service';
import SupabaseService from './services/supabase.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ConfigModule,
    BackendConfigurationService,
    DatabaseService,
    SupabaseService,
  ],
  exports: [DatabaseService, SupabaseService, BackendConfigurationService],
  controllers: [VersionController],
})
export class CommonModule {}
