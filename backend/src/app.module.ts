import { TableauDeBordModule } from '@/backend/collectivites/tableau-de-bord/tableau-de-bord.module';
import { EchartsModule } from '@/backend/utils/echarts/echarts.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import { AuthModule } from './auth/auth.module';
import { CollectivitesModule } from './collectivites/collectivites.module';
import { IndicateursModule } from './indicateurs/indicateurs.module';
import { PersonnalisationsModule } from './personnalisations/personnalisations.module';
import { FichesActionModule } from './plans/fiches/fiches.module';
import { ReferentielsModule } from './referentiels/referentiels.module';
import configuration from './utils/config/configuration';
import { ConfigurationModule } from './utils/config/configuration.module';
import { DatabaseModule } from './utils/database/database.module';
import { SheetModule } from './utils/google-sheets/sheet.module';
import { TrpcModule } from './utils/trpc/trpc.module';
import { TrpcRouter } from './utils/trpc/trpc.router';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In production, environment variables are set by the deployment
      // validate: validateBackendConfiguration,
      load: [configuration],
    }),
    ConfigurationModule,
    // Test without
    UtilsModule,
    EchartsModule,
    DatabaseModule,
    TrpcModule,
    SheetModule,
    CollectivitesModule,
    TableauDeBordModule,
    IndicateursModule,
    AuthModule,
    FichesActionModule,
    PersonnalisationsModule,
    ReferentielsModule,
  ],
  providers: [TrpcRouter],
})
export class AppModule {}
