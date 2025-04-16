import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ConfigurationModule } from '@/tools-automation-api/config/configuration.module';

@Global()
@Module({
  imports: [ConfigurationModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
