import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VersionController } from './controllers/version.controller';
import BackendConfigurationService from './services/backend-configuration.service';
import DatabaseService from './services/database.service';

@Module({
  imports: [ConfigModule],
  providers: [ConfigModule, BackendConfigurationService, DatabaseService],
  exports: [DatabaseService, BackendConfigurationService],
  controllers: [VersionController],
})
export class CommonModule {}
