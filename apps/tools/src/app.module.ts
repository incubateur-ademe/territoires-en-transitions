import { Logger, Module } from '@nestjs/common';

import { AirtableModule } from '@/tools/airtable/airtable.module';
import { CalendlyModule } from '@/tools/calendly/calendly.module';
import { CronModule } from '@/tools/cron/cron.module';
import { ToolsIndicateursModule } from '@/tools/indicateurs/tools-indicateurs.module';
import { SireneModule } from '@/tools/sirene/sirene.module';
import { WebhookModule } from '@/tools/webhooks/webhook.module';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { uuid4 } from '@sentry/core';
import { SentryModule } from '@sentry/nestjs/setup';
import basicAuth from 'express-basic-auth';
import configuration from './config/configuration';
import { ConfigurationModule } from './config/configuration.module';
import ConfigurationService from './config/configuration.service';
import { ConnectModule } from './connect/connect.module';
import { CrispModule } from './crisp/crisp.module';
import { NotionModule } from './notion/notion.module';
import { SentryNotificationModule } from './sentry/sentry-notification.module';
import { DatabaseModule } from './utils/database/database.module';
import { UtilsModule } from './utils/utils.module';

const appLogger = new Logger('AppModule');

@Module({
  imports: [
    SentryModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In production, environment variables are set by the deployment
      load: [configuration],
    }),
    ConfigurationModule,
    CronModule,
    BullModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: async (config: ConfigurationService) => {
        const host = config.get('QUEUE_REDIS_HOST');
        const port = config.get('QUEUE_REDIS_PORT');

        appLogger.log(`Connecting to Redis at ${host}:${port}`);

        return {
          connection: {
            host: host,
            port: port,
          },
        };
      },
      inject: [ConfigurationService],
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
      middleware: basicAuth({
        challenge: true,
        users: { admin: process.env.TET_API_TOKEN || uuid4() },
      }),
    }),
    UtilsModule,
    DatabaseModule,
    NotionModule,
    CrispModule,
    SentryNotificationModule,
    WebhookModule,
    AirtableModule,
    CalendlyModule,
    ConnectModule,
    SireneModule,
    ToolsIndicateursModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
