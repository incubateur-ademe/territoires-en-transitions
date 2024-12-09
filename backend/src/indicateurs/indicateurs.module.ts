import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { SheetModule } from '../spreadsheets/sheet.module';
import { TrpcModule } from '../trpc/trpc.module';
import { ConfigModule } from '../utils/config/config.module';
import { IndicateursController } from './controllers/indicateurs.controller';
import { TrajectoiresController } from './controllers/trajectoires.controller';
import { IndicateurFiltreRouter } from './indicateur-filtre/indicateur-filtre.router';
import IndicateurFiltreService from './indicateur-filtre/indicateur-filtre.service';
import ExportIndicateursService from './shared/services/export-indicateurs.service';
import IndicateurSourcesService from './shared/services/indicateur-sources.service';
import IndicateursService from './shared/services/indicateurs.service';
import TrajectoiresDataService from './trajectoires/trajectoires-data.service';
import TrajectoiresSpreadsheetService from './trajectoires/trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './trajectoires/trajectoires-xlsx.service';
import { TrajectoiresRouter } from './trajectoires/trajectoires.router';

@Module({
  imports: [
    ConfigModule,
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
