import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CollectivitesModule } from './collectivites/collectivites.module';
import { CommonModule } from './common/common.module';
import { validateBackendConfiguration } from './common/services/backend-configuration.service';
import { IndicateursModule } from './indicateurs/indicateurs.module';
import { PersonnalisationsModule } from './personnalisations/personnalisations.module';
import { ReferentielsModule } from './referentiels/referentiels.module';
import { SheetModule } from './spreadsheets/sheet.module';
import { TrpcRouter } from './trpc.router';
import { TrpcModule } from './trpc/trpc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In production, environment variables are set by the deployment
      validate: validateBackendConfiguration,
    }),
    TrpcModule,
    CommonModule,
    SheetModule,
    CollectivitesModule,
    IndicateursModule,
    AuthModule,
    PersonnalisationsModule,
    ReferentielsModule,
  ],
  controllers: [],
  exports: [TrpcRouter],
  providers: [TrpcRouter],
})
export class AppModule {}
