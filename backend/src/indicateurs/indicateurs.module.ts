import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { SheetModule } from '../spreadsheets/sheet.module';
import { TrpcModule } from '../trpc/trpc.module';
import { TrajectoiresController } from './controllers/trajectoires.controller';
import { TrajectoiresRouter } from './routers/trajectoires.router';
import IndicateursService from './service/indicateurs.service';
import IndicateurSourcesService from './service/indicateurSources.service';
import TrajectoiresService from './service/trajectoires.service';

@Module({
  imports: [TrpcModule, CommonModule, CollectivitesModule, SheetModule],
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
  controllers: [TrajectoiresController],
})
export class IndicateursModule {}
