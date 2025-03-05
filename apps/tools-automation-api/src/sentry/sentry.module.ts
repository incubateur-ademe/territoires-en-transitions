import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { NotionModule } from '../notion/notion.module';
import { SentryController } from './controllers/sentry.controller';
import { SentryService } from './services/sentry.service';

@Module({
  imports: [ConfigurationModule, NotionModule],
  controllers: [SentryController],
  providers: [SentryService],
})
export class SentryModule {}
