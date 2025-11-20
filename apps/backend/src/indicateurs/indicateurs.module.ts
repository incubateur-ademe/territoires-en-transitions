import { Module } from '@nestjs/common';
import { HandleDefinitionFichesService } from '@tet/backend/indicateurs/definitions/handle-definition-fiches/handle-definition-fiches.service';
import { HandleDefinitionPilotesService } from '@tet/backend/indicateurs/definitions/handle-definition-pilotes/handle-definition-pilotes.service';
import { HandleDefinitionServicesService } from '@tet/backend/indicateurs/definitions/handle-definition-services/handle-definition-services.service';
import { HandleDefinitionThematiquesService } from '@tet/backend/indicateurs/definitions/handle-definition-thematiques/handle-definition-thematiques.service';
import { IndicateurDefinitionsRouter } from '@tet/backend/indicateurs/definitions/indicateur-definitions.router';
import { IndicateursListDefinitionsController } from '@tet/backend/indicateurs/definitions/list-definitions/list-definitions.controller';
import CreateDefinitionService from '@tet/backend/indicateurs/definitions/mutate-definition/create-definition.service';
import { MutateDefinitionRouter } from '@tet/backend/indicateurs/definitions/mutate-definition/mutate-definition.router';
import { IndicateursRouter } from '@tet/backend/indicateurs/indicateurs.router';
import { TrajectoireLeviersController } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.controller';
import { TrajectoireLeviersRouter } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.router';
import ComputeValeursService from '@tet/backend/indicateurs/valeurs/compute-valeurs.service';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { PersonnalisationsModule } from '../collectivites/personnalisations/personnalisations.module';
import PersonnalisationsExpressionService from '../collectivites/personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '../collectivites/personnalisations/services/personnalisations-service';
import { AuthModule } from '../users/auth.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { ListDefinitionsRouter } from './definitions/list-definitions/list-definitions.router';
import { ListDefinitionsService } from './definitions/list-definitions/list-definitions.service';
import { ListDefinitionIdsRepository } from './definitions/list-platform-predefined-definitions/list-definition-ids.repository';
import { ListDefinitionsHavingComputedValueRepository } from './definitions/list-platform-predefined-definitions/list-definitions-having-computed-value.repository';
import { ListDefinitionsLightRepository } from './definitions/list-platform-predefined-definitions/list-definitions-light.repository';
import { DeleteDefinitionService } from './definitions/mutate-definition/delete-definition.service';
import { UpdateDefinitionService } from './definitions/mutate-definition/update-definition.service';
import { ExportIndicateursController } from './export-indicateurs/export-indicateurs.controller';
import ExportIndicateursService from './export-indicateurs/export-indicateurs.service';
import { ImportIndicateurDefinitionController } from './import-indicateurs/import-indicateur-definition.controller';
import ImportIndicateurDefinitionService from './import-indicateurs/import-indicateur-definition.service';
import { IndicateurSourcesRouter } from './sources/indicateur-sources.router';
import IndicateurSourcesService from './sources/indicateur-sources.service';
import { TrajectoireLeviersService } from './trajectoire-leviers/trajectoire-leviers.service';
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

// Sub-domain indicateurs.definitions
const DEFINITIONS_PROVIDERS = [
  IndicateurDefinitionsRouter,

  ListDefinitionsService,
  ListDefinitionsRouter,

  ListDefinitionIdsRepository,
  ListDefinitionsLightRepository,
  ListDefinitionsHavingComputedValueRepository,

  CreateDefinitionService,
  UpdateDefinitionService,
  DeleteDefinitionService,
  MutateDefinitionRouter,

  HandleDefinitionPilotesService,
  HandleDefinitionServicesService,
  HandleDefinitionThematiquesService,
  HandleDefinitionFichesService,
];

@Module({
  imports: [
    AuthModule,
    CollectivitesModule,
    SheetModule,
    PersonnalisationsModule,
  ],
  providers: [
    ExportIndicateursService,
    IndicateurSourcesService,
    IndicateurSourcesService,
    IndicateurExpressionService,
    CrudValeursService,
    ImportIndicateurDefinitionService,
    ValeursMoyenneService,
    ValeursReferenceService,

    IndicateurValeursRouter,
    IndicateurSourcesRouter,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
    TrajectoireLeviersService,
    TrajectoireLeviersRouter,

    PersonnalisationsService,
    PersonnalisationsExpressionService,
    ComputeValeursService,
    IndicateursRouter,

    ...DEFINITIONS_PROVIDERS,
  ],
  exports: [
    ListDefinitionsService,
    ListDefinitionIdsRepository,
    ListDefinitionsLightRepository,

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
    TrajectoireLeviersController,
  ],
})
export class IndicateursModule {}
