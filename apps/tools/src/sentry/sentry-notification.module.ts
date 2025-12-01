import { SentryNotificationController } from './controllers/sentry-notification.controller';
import { SentryNotificationService } from './services/sentry-notification.service';
import { UtilsModule } from '../utils/utils.module';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';

@Module({
  imports: [ConfigurationModule, UtilsModule],
  controllers: [SentryNotificationController],
  providers: [SentryNotificationService],
})
export class SentryNotificationModule {}
