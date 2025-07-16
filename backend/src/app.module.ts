import { MetricsModule } from '@/backend/metrics/metrics.module';
import { SharedModule } from '@/backend/shared/shared.module';
import { EchartsModule } from '@/backend/utils/echarts/echarts.module';
import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { CollectivitesModule } from './collectivites/collectivites.module';
import { IndicateursModule } from './indicateurs/indicateurs.module';
import { PersonnalisationsModule } from './personnalisations/personnalisations.module';
import { FichesModule } from './plans/fiches/fiches.module';
import { PlanModule } from './plans/plans/plan.module';
import { ReferentielsModule } from './referentiels/referentiels.module';
import { AuthModule } from './users/auth.module';
import configuration from './utils/config/configuration';
import { ConfigurationModule } from './utils/config/configuration.module';
import ConfigurationService from './utils/config/configuration.service';
import { DatabaseModule } from './utils/database/database.module';
import { SheetModule } from './utils/google-sheets/sheet.module';
import { TrackingModule } from './utils/tracking/tracking.module';
import { TrpcModule } from './utils/trpc/trpc.module';
import { TrpcRouter } from './utils/trpc/trpc.router';
import { UtilsModule } from './utils/utils.module';

const appLogger = new Logger('AppModule');

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In production, environment variables are set by the deployment
      // validate: validateBackendConfiguration,
      load: [configuration],
    }),
    ConfigurationModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => [
        {
          ttl: config.get('PUBLIC_API_THROTTLE_TTL'),
          limit: config.get('PUBLIC_API_THROTTLE_LIMIT'),
        },
      ],
    }),
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
    // Test without
    UtilsModule,
    EchartsModule,
    DatabaseModule,
    TrpcModule,
    SheetModule,
    CollectivitesModule,
    IndicateursModule,
    AuthModule,
    FichesModule,
    PlanModule,
    PersonnalisationsModule,
    ReferentielsModule,
    SharedModule,
    TrackingModule,
    MetricsModule,
  ],
  providers: [
    TrpcRouter,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
