import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { IndicateurFiltreRouter } from './definitions/indicateur-filtre.router';
import IndicateurFiltreService from './definitions/indicateur-filtre.service';
import ListDefinitionsService from './definitions/list-definitions.service';
import { ExportIndicateursController } from './export-indicateurs/export-indicateurs.controller';
import ExportIndicateursService from './export-indicateurs/export-indicateurs.service';
import IndicateurSourcesService from './sources/indicateur-sources.service';
import TrajectoiresDataService from './trajectoires/trajectoires-data.service';
import TrajectoiresSpreadsheetService from './trajectoires/trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './trajectoires/trajectoires-xlsx.service';
import { TrajectoiresController } from './trajectoires/trajectoires.controller';
import { TrajectoiresRouter } from './trajectoires/trajectoires.router';
import { IndicateursController } from './valeurs/crud-valeurs.controller';
import { IndicateurValeursRouter } from './valeurs/crud-valeurs.router';
import CrudValeursService from './valeurs/crud-valeurs.service';

@Module({
  imports: [AuthModule, CollectivitesModule, SheetModule],
  providers: [
    ExportIndicateursService,
    IndicateurSourcesService,
    ListDefinitionsService,
    CrudValeursService,
    IndicateurFiltreService,
    IndicateurFiltreRouter,
    IndicateurValeursRouter,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
  ],
  exports: [
    IndicateurSourcesService,
    ListDefinitionsService,
    CrudValeursService,
    TrajectoiresRouter,
    IndicateurFiltreService,
    IndicateurFiltreRouter,
    IndicateurValeursRouter,
  ],
  controllers: [
    IndicateursController,
    ExportIndicateursController,
    TrajectoiresController,
  ],
})
export class IndicateursModule {}
