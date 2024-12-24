import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { IndicateursController } from './controllers/indicateurs.controller';
import { ExportIndicateursController } from './export-indicateurs/export-indicateurs.controller';
import ExportIndicateursService from './export-indicateurs/export-indicateurs.service';
import { IndicateurFiltreRouter } from './list-indicateurs/indicateur-filtre.router';
import IndicateurFiltreService from './list-indicateurs/indicateur-filtre.service';
import IndicateurSourcesService from './services/indicateur-sources.service';
import IndicateursService from './services/indicateurs.service';
import TrajectoiresDataService from './trajectoires/trajectoires-data.service';
import TrajectoiresSpreadsheetService from './trajectoires/trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './trajectoires/trajectoires-xlsx.service';
import { TrajectoiresController } from './trajectoires/trajectoires.controller';
import { TrajectoiresRouter } from './trajectoires/trajectoires.router';

@Module({
  imports: [AuthModule, CollectivitesModule, SheetModule],
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
  controllers: [
    IndicateursController,
    ExportIndicateursController,
    TrajectoiresController,
  ],
})
export class IndicateursModule {}
