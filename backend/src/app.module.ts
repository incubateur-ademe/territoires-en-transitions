import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CollectivitesModule } from './collectivites/collectivites.module';
import { CommonModule } from './common/common.module';
import configuration from './config/configuration';
import { FichesActionModule } from './fiches/fiches-action.module';
import { IndicateursModule } from './indicateurs/indicateurs.module';
import { PersonnalisationsModule } from './personnalisations/personnalisations.module';
import { SheetModule } from './spreadsheets/sheet.module';
import { TrpcModule } from './trpc/trpc.module';
import { ConfigurationModule } from './config/configuration.module';
import { TrpcRouter } from './trpc/trpc.router';
import { ReferentielsModule } from './referentiels/referentiels.module';

@Module({
  imports: [
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
  ],
  providers: [TrpcRouter],
})
export class AppModule {}
