import { VersionController } from '@/backend/utils/version/version.controller';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';

@Module({
  imports: [ConfigurationModule],
  controllers: [VersionController],
  providers: [],
  exports: [],
})
export class UtilsModule {}
