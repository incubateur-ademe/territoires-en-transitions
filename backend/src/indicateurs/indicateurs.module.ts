import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule, SheetModule } from '../utils';
import { ConfigModule } from '../utils/config/config.module';
import { IndicateurFiltreRouter } from './indicateur-filtre/indicateur-filtre.router';
import IndicateurFiltreService from './indicateur-filtre/indicateur-filtre.service';
import { IndicateursController } from './shared/controllers/indicateurs.controller';
import { ExportIndicateursService } from './shared/services/export-indicateurs.service';
import IndicateurSourcesService from './shared/services/indicateur-sources.service';
import { IndicateursService } from './shared/services/indicateurs.service';
import TrajectoiresDataService from './trajectoires/trajectoires-data.service';
import TrajectoiresSpreadsheetService from './trajectoires/trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './trajectoires/trajectoires-xlsx.service';
import { TrajectoiresController } from './trajectoires/trajectoires.controller';
import { TrajectoiresRouter } from './trajectoires/trajectoires.router';

@Module({
  imports: [ConfigModule, CommonModule, CollectivitesModule, SheetModule],
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
