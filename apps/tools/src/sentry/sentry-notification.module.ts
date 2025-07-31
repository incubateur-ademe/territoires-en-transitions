import { SentryNotificationController } from '@/tools/sentry/controllers/sentry-notification.controller';
import { SentryNotificationService } from '@/tools/sentry/services/sentry-notification.service';
import { UtilsModule } from '@/tools/utils/utils.module';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';

@Module({
  imports: [ConfigurationModule, UtilsModule],
  controllers: [SentryNotificationController],
  providers: [SentryNotificationService],
})
export class SentryNotificationModule {}
