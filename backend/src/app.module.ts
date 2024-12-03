import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { AuthModule } from './auth/auth.module';
import { CollectivitesModule } from './collectivites/collectivites.module';
import { IndicateursModule } from './indicateurs/indicateurs.module';
import { FichesActionModule } from './plans/fiches/fiches-action.module';
import { ReferentielsModule } from './referentiels/referentiels.module';
import { PersonnalisationsModule } from './referentiels/scores/personnalisations/personnalisations.module';
import { CommonModule } from './utils/common/common.module';
import { ConfigModule } from './utils/config/config.module';
import { SheetModule } from './utils/spreadsheets/sheet.module';
import { TrpcModule } from './utils/trpc/trpc.module';
import { TrpcRouter } from './utils/trpc/trpc.router';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule,
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
