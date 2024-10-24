import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { VersionController } from './controllers/version.controller';
import DatabaseService from './services/database.service';

@Module({
  imports: [ConfigurationModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
  controllers: [VersionController],
})
export class CommonModule {}
