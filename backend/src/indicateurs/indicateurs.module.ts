import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { SheetModule } from '../spreadsheets/sheet.module';
import { TrpcModule } from '../trpc/trpc.module';
import { ConfigurationModule } from '../utils/config/configuration.module';
import { IndicateursController } from './controllers/indicateurs.controller';
import { TrajectoiresController } from './controllers/trajectoires.controller';
import { IndicateurFiltreRouter } from './indicateur-filtre/indicateur-filtre.router';
import IndicateurFiltreService from './indicateur-filtre/indicateur-filtre.service';
import { TrajectoiresRouter } from './shared/routers/trajectoires.router';
import ExportIndicateursService from './shared/services/export-indicateurs.service';
import IndicateurSourcesService from './shared/services/indicateur-sources.service';
import IndicateursService from './shared/services/indicateurs.service';
import TrajectoiresDataService from './shared/services/trajectoires-data.service';
import TrajectoiresSpreadsheetService from './shared/services/trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './shared/services/trajectoires-xlsx.service';

@Module({
  imports: [
    ConfigurationModule,
    CommonModule,
    TrpcModule,
    AuthModule,
    CollectivitesModule,
    SheetModule,
  ],
  providers: [
    ExportIndicateursService,
    IndicateurSourcesService,
    IndicateursService,
    IndicateurFiltreService,
    IndicateurFiltreRouter,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
  ],
  exports: [
    IndicateurSourcesService,
    IndicateursService,
    TrajectoiresRouter,
    IndicateurFiltreService,
    IndicateurFiltreRouter,
  ],
  controllers: [IndicateursController, TrajectoiresController],
})
export class IndicateursModule {}
