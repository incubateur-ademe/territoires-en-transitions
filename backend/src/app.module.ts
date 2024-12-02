import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import { AuthModule } from './auth/auth.module';
import { CollectivitesModule } from './collectivites/collectivites.module';
import { CommonModule } from './common/common.module';
import { FichesActionModule } from './fiches/fiches-action.module';
import { IndicateursModule } from './indicateurs/indicateurs.module';
import { PersonnalisationsModule } from './personnalisations/personnalisations.module';
import { ReferentielsModule } from './referentiels/referentiels.module';
import { SheetModule } from './spreadsheets/sheet.module';
import { TaxonomieModule } from './taxonomie/taxonomie.module';
import { TrpcModule } from './trpc/trpc.module';
import { TrpcRouter } from './trpc/trpc.router';
import configuration from './utils/config/configuration';
import { ConfigurationModule } from './utils/config/configuration.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In production, environment variables are set by the deployment
      // validate: validateBackendConfiguration,
      load: [configuration],
    }),
    ConfigurationModule,
    CommonModule,
    TrpcModule,
    SheetModule,
    CollectivitesModule,
    IndicateursModule,
    AuthModule,
    FichesActionModule,
    PersonnalisationsModule,
    ReferentielsModule,
    TaxonomieModule,
  ],
  providers: [TrpcRouter],
})
export class AppModule {}
