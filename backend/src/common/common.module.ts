import { Module } from '@nestjs/common';
import { VersionController } from './controllers/version.controller';
import DatabaseService from './services/database.service';
import SupabaseService from './services/supabase.service';

@Module({
  providers: [DatabaseService, SupabaseService],
  exports: [DatabaseService, SupabaseService],
  controllers: [VersionController],
})
export class CommonModule {}
