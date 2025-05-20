import ComputeValeursService from '@/backend/indicateurs/valeurs/compute-valeurs.service';
import IndicateurExpressionService from '@/backend/indicateurs/valeurs/indicateur-expression.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import PersonnalisationsExpressionService from '../personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '../personnalisations/services/personnalisations-service';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { IndicateurFiltreRouter } from './definitions/indicateur-filtre.router';
import IndicateurFiltreService from './definitions/indicateur-filtre.service';
import { ExportIndicateursController } from './export-indicateurs/export-indicateurs.controller';
import ExportIndicateursService from './export-indicateurs/export-indicateurs.service';
import { ImportIndicateurDefinitionController } from './import-indicateurs/import-indicateur-definition.controller';
import ImportIndicateurDefinitionService from './import-indicateurs/import-indicateur-definition.service';
import { IndicateurDefinitionsRouter } from './list-definitions/list-definitions.router';
import { ListDefinitionsService } from './list-definitions/list-definitions.service';
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
import ValeursReferenceService from './valeurs/valeurs-reference.service';

@Module({
  imports: [AuthModule, CollectivitesModule, SheetModule],
  providers: [
    ExportIndicateursService,
    IndicateurSourcesService,
    ListDefinitionsService,
    IndicateurDefinitionsRouter,
    IndicateurSourcesService,
    IndicateurExpressionService,
    CrudValeursService,
    ImportIndicateurDefinitionService,
    ValeursMoyenneService,
    ValeursReferenceService,
    IndicateurFiltreService,
    IndicateurFiltreRouter,
    IndicateurValeursRouter,
    IndicateurSourcesRouter,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
    PersonnalisationsService,
    PersonnalisationsExpressionService,
    ComputeValeursService,
  ],
  exports: [
    IndicateurSourcesService,
    ListDefinitionsService,
    IndicateurExpressionService,
    IndicateurDefinitionsRouter,
    IndicateurSourcesRouter,
    CrudValeursService,
    ValeursMoyenneService,
    ValeursReferenceService,
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
