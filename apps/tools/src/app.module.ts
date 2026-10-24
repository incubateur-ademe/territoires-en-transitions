import { Logger, Module } from '@nestjs/common';

import { AirtableModule } from './airtable/airtable.module';
import { CalendlyModule } from './calendly/calendly.module';
import { CronModule } from './cron/cron.module';
import { ToolsIndicateursModule } from './indicateurs/tools-indicateurs.module';
import { SireneModule } from './sirene/sirene.module';
import { WebhookModule } from './webhooks/webhook.module';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { buildQueueRedisConnection } from '@tet/backend/utils/config/build-queue-redis-connection';
import basicAuth from 'express-basic-auth';
import configuration from './config/configuration';
import { ConfigurationModule } from './config/configuration.module';
import ConfigurationService from './config/configuration.service';
import { ConnectModule } from './connect/connect.module';
import { CrispModule } from './crisp/crisp.module';
import { NotionModule } from './notion/notion.module';
import { PosthogModule } from './posthog/posthog.module';
import { DatabaseModule } from './utils/database/database.module';
import { UtilsModule } from './utils/utils.module';

const appLogger = new Logger('AppModule');

@Module({
  imports: [
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
        const connection = buildQueueRedisConnection({
          QUEUE_REDIS_HOST: config.get('QUEUE_REDIS_HOST'),
          QUEUE_REDIS_PORT: config.get('QUEUE_REDIS_PORT'),
          QUEUE_REDIS_URL: config.get('QUEUE_REDIS_URL'),
          QUEUE_REDIS_TLS_CA: config.get('QUEUE_REDIS_TLS_CA'),
        });

        appLogger.log(
          `Connecting to Redis at ${connection.host}:${connection.port}${
            connection.tls ? ' (TLS)' : ''
          }`
        );

        return { connection };
      },
      inject: [ConfigurationService],
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
      middleware: basicAuth({
        challenge: true,
        users: { admin: process.env.TET_API_TOKEN || crypto.randomUUID() },
      }),
    }),
    UtilsModule,
    DatabaseModule,
    NotionModule,
    CrispModule,
    WebhookModule,
    AirtableModule,
    CalendlyModule,
    ConnectModule,
    SireneModule,
    ToolsIndicateursModule,
    PosthogModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
