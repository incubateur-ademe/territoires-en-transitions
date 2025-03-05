import { UtilsModule } from '@/tools-automation-api/utils/utils.module';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { SentryController } from './controllers/sentry.controller';
import { SentryService } from './services/sentry.service';

@Module({
  imports: [ConfigurationModule, UtilsModule],
  controllers: [SentryController],
  providers: [SentryService],
})
export class SentryModule {}
