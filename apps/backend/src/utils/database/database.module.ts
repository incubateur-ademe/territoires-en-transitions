import { Global, Module } from '@nestjs/common';
import { AnalyticsDatabaseService } from './analytics-database.service';
import { DatabaseService } from './database.service';
import SupabaseService from './supabase.service';

@Global()
@Module({
  providers: [DatabaseService, SupabaseService, AnalyticsDatabaseService],
  exports: [DatabaseService, SupabaseService, AnalyticsDatabaseService],
})
export class DatabaseModule {}
