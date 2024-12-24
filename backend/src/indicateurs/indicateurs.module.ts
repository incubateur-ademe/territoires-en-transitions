import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { IndicateursController } from './controllers/indicateurs.controller';
import { IndicateurFiltreRouter } from './indicateur-filtre/indicateur-filtre.router';
import IndicateurFiltreService from './indicateur-filtre/indicateur-filtre.service';
import ExportIndicateursService from './services/export-indicateurs.service';
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
  controllers: [IndicateursController, TrajectoiresController],
})
export class IndicateursModule {}
