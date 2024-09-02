import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { SheetModule } from '../spreadsheets/sheet.module';
import { TrpcModule } from '../trpc/trpc.module';
import { IndicateursController } from './controllers/indicateurs.controller';
import { TrajectoiresController } from './controllers/trajectoires.controller';
import { TrajectoiresRouter } from './routers/trajectoires.router';
import IndicateursService from './services/indicateurs.service';
import IndicateurSourcesService from './services/indicateurSources.service';
import TrajectoiresService from './services/trajectoires.service';

@Module({
  imports: [
    TrpcModule,
    CommonModule,
    AuthModule,
    CollectivitesModule,
    SheetModule,
  ],
  providers: [
    IndicateurSourcesService,
    IndicateursService,
    TrajectoiresService,
    TrajectoiresRouter,
  ],
  exports: [
    IndicateurSourcesService,
    IndicateursService,
    TrajectoiresService,
    TrajectoiresRouter,
  ],
  controllers: [IndicateursController, TrajectoiresController],
})
export class IndicateursModule {}
