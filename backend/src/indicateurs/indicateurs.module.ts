import IndicateurValeurExpressionParserService from '@/backend/indicateurs/valeurs/indicateur-valeur-expression-parser.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { IndicateurFiltreRouter } from './definitions/indicateur-filtre.router';
import IndicateurFiltreService from './definitions/indicateur-filtre.service';
import { IndicateurDefinitionsRouter } from './definitions/list-definitions.router';
import ListDefinitionsService from './definitions/list-definitions.service';
import { ExportIndicateursController } from './export-indicateurs/export-indicateurs.controller';
import ExportIndicateursService from './export-indicateurs/export-indicateurs.service';
import { ImportIndicateurDefinitionController } from './import-indicateurs/import-indicateur-definition.controller';
import ImportIndicateurDefinitionService from './import-indicateurs/import-indicateur-definition.service';
import { IndicateurSourcesRouter } from './sources/indicateur-sources.router';
import IndicateurSourcesService from './sources/indicateur-sources.service';
import TrajectoiresDataService from './trajectoires/trajectoires-data.service';
import TrajectoiresSpreadsheetService from './trajectoires/trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './trajectoires/trajectoires-xlsx.service';
import { TrajectoiresController } from './trajectoires/trajectoires.controller';
import { TrajectoiresRouter } from './trajectoires/trajectoires.router';
import { IndicateursController } from './valeurs/crud-valeurs.controller';
import { IndicateurValeursRouter } from './valeurs/crud-valeurs.router';
import CrudValeursService from './valeurs/crud-valeurs.service';
import ValeursMoyenneService from './valeurs/valeurs-moyenne.service';

@Module({
  imports: [AuthModule, CollectivitesModule, SheetModule],
  providers: [
    ExportIndicateursService,
    IndicateurSourcesService,
    ListDefinitionsService,
    IndicateurDefinitionsRouter,
    IndicateurSourcesService,
    IndicateurValeurExpressionParserService,
    ImportIndicateurDefinitionService,
    CrudValeursService,
    ValeursMoyenneService,
    IndicateurFiltreService,
    IndicateurFiltreRouter,
    IndicateurValeursRouter,
    IndicateurSourcesRouter,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
  ],
  exports: [
    IndicateurSourcesService,
    ListDefinitionsService,
    IndicateurDefinitionsRouter,
    IndicateurSourcesRouter,
    CrudValeursService,
    ValeursMoyenneService,
    TrajectoiresRouter,
    IndicateurFiltreService,
    IndicateurFiltreRouter,
    IndicateurValeursRouter,
  ],
  controllers: [
    IndicateursController,
    ImportIndicateurDefinitionController,
    ExportIndicateursController,
    TrajectoiresController,
  ],
})
export class IndicateursModule {}
