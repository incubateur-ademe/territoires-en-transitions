import { Global, Module } from '@nestjs/common';
import { ConfigurationModule } from '../../config/configuration.module';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [ConfigurationModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
