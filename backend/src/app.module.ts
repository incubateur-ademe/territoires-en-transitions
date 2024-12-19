import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import { AuthModule } from './auth/auth.module';
import { CollectivitesModule } from './collectivites/collectivites.module';
import { CommonModule } from './common/common.module';
import configuration from './config/configuration';
import { ConfigurationModule } from './config/configuration.module';
import { IndicateursModule } from './indicateurs/indicateurs.module';
import { PersonnalisationsModule } from './personnalisations/personnalisations.module';
import { FichesActionModule } from './plans/fiches/fiches.module';
import { ReferentielsModule } from './referentiels/referentiels.module';
import { TaxonomieModule } from './taxonomie/taxonomie.module';
import { SheetModule } from './utils/google-sheets/sheet.module';
import { TrpcModule } from './utils/trpc/trpc.module';
import { TrpcRouter } from './utils/trpc/trpc.router';

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
