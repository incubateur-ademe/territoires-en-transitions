import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ConfigurationModule } from './config/configuration.module';
import { CrispModule } from './crisp/crisp.module';
import { NotionModule } from './notion/notion.module';
import { SentryModule } from './sentry/sentry.module';
import { UtilsModule } from './utils/utils.module';
import { VersionController } from './utils/version/version.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In production, environment variables are set by the deployment
      // validate: validateBackendConfiguration,
      load: [configuration],
    }),
    ConfigurationModule,
    UtilsModule,
    NotionModule,
    CrispModule,
    SentryModule,
  ],
  controllers: [VersionController],
  providers: [],
})
export class AppModule {}
