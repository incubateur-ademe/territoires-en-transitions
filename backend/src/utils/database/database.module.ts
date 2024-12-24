import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import SupabaseService from './supabase.service';

@Global()
@Module({
  providers: [DatabaseService, SupabaseService],
  exports: [DatabaseService, SupabaseService],
})
export class DatabaseModule {}
