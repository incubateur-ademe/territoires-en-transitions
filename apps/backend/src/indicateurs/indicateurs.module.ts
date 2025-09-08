import { HandleDefinitionPilotesRouter } from '@/backend/indicateurs/definitions/handle-definition-pilotes/handle-definition-pilotes.router';
import { HandleDefinitionPilotesService } from '@/backend/indicateurs/definitions/handle-definition-pilotes/handle-definition-pilotes.service';
import { HandleDefinitionServicesRouter } from '@/backend/indicateurs/definitions/handle-definition-services/handle-definition-services.router';
import { HandleDefinitionServicesService } from '@/backend/indicateurs/definitions/handle-definition-services/handle-definition-services.service';
import { HandleDefinitionThematiquesRouter } from '@/backend/indicateurs/definitions/handle-definition-thematiques/handle-definition-thematiques.router';
import { HandleDefinitionThematiquesService } from '@/backend/indicateurs/definitions/handle-definition-thematiques/handle-definition-thematiques.service';
import { IndicateurDefinitionsRouter } from '@/backend/indicateurs/definitions/indicateur-definitions.router';
import CreateIndicateurPersoService from '@/backend/indicateurs/definitions/list-definitions/create-indicateur-perso.service';
import { IndicateursListDefinitionsController } from '@/backend/indicateurs/definitions/list-definitions/list-definitions.controller';
import { UpdateIndicateurDefinitionsRouter } from '@/backend/indicateurs/definitions/update-definitions/update-definitions.router';
import { UpdateIndicateurDefinitionsService } from '@/backend/indicateurs/definitions/update-definitions/update-definitions.service';
import { IndicateursRouter } from '@/backend/indicateurs/indicateurs.router';
import ComputeValeursService from '@/backend/indicateurs/valeurs/compute-valeurs.service';
import IndicateurExpressionService from '@/backend/indicateurs/valeurs/indicateur-expression.service';
import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import PersonnalisationsExpressionService from '../personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '../personnalisations/services/personnalisations-service';
import { AuthModule } from '../users/auth.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { ListDefinitionsRouter } from './definitions/list-definitions/list-definitions.router';
import { ListDefinitionsService } from './definitions/list-definitions/list-definitions.service';
import { ListIndicateursRouter } from './definitions/list-indicateurs.router';
import ListIndicateursService from './definitions/list-indicateurs.service';
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
import { IndicateursValeursController } from './valeurs/crud-valeurs.controller';
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
    ListDefinitionsRouter,
    IndicateurSourcesService,
    IndicateurExpressionService,
    CrudValeursService,
    ImportIndicateurDefinitionService,
    ValeursMoyenneService,
    ValeursReferenceService,
    ListIndicateursService,
    ListIndicateursRouter,
    IndicateurValeursRouter,
    IndicateurSourcesRouter,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
    PersonnalisationsService,
    PersonnalisationsExpressionService,
    ComputeValeursService,
    CreateIndicateurPersoService,
    IndicateurDefinitionsRouter,
    IndicateursRouter,
    HandleDefinitionPilotesRouter,
    HandleDefinitionServicesRouter,
    HandleDefinitionThematiquesRouter,
    UpdateIndicateurDefinitionsService,
    UpdateIndicateurDefinitionsRouter,
    HandleDefinitionPilotesService,
    HandleDefinitionServicesService,
    HandleDefinitionThematiquesService,
  ],
  exports: [
    ListDefinitionsService,
    IndicateurExpressionService,
    CrudValeursService,

    ValeursMoyenneService,
    ValeursReferenceService,

    IndicateursRouter,
  ],
  controllers: [
    IndicateursValeursController,
    IndicateursListDefinitionsController,
    ImportIndicateurDefinitionController,
    ExportIndicateursController,
    TrajectoiresController,
  ],
})
export class IndicateursModule {}
