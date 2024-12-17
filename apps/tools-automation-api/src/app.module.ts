import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { VersionController } from './common/version.controller';
import configuration from './config/configuration';
import { ConfigurationModule } from './config/configuration.module';
import { CrispModule } from './crisp/crisp.module';
import { NotionModule } from './notion/notion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In production, environment variables are set by the deployment
      // validate: validateBackendConfiguration,
      load: [configuration],
    }),
    ConfigurationModule,
    NotionModule,
    CrispModule,
  ],
  controllers: [VersionController],
  providers: [],
})
export class AppModule {}
