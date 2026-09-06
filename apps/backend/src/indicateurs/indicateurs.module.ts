import { TrackingModule } from '../utils/tracking/tracking.module';
import { MutateDefinitionRepository } from './definitions/mutate-definition/mutate-definition.repository';
import { IndicateurPeriodiciteAvailabilityService } from './definitions/indicateur-periodicite-availability.service';
import { IndicateurChartBuilder } from './charts/indicateur-chart.builder';
import { IndicateurFormulaReconciliationRepository } from './definitions/indicateur-formula-reconciliation.repository';
import { IndicateurFormulaReconciliationService } from './definitions/indicateur-formula-reconciliation.service';
import { IndicateurFormulaReconciliationRouter } from './definitions/indicateur-formula-reconciliation.router';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { WriteIndicateurValeursService } from './valeurs/write-indicateur-valeurs.service';
import { ValidateIndicateurValeursWriteService } from './valeurs/validate-indicateur-valeurs-write.service';
import { ReconcileIndicateurValeursService } from './valeurs/reconcile-indicateur-valeurs.service';
import { IndicateurDefinitionLockRepository } from './definitions/indicateur-definition-lock.repository';
import { IndicateurValeurLockRepository } from './valeurs/indicateur-valeur-lock.repository';
import { ComputeValeursRepository } from './valeurs/compute-valeurs.repository';
import { LoadIndicateurCalculGraphService } from './valeurs/load-indicateur-calcul-graph.service';
import { CrudValeursRepository } from './valeurs/crud-valeurs.repository';
import { ListIndicateurValeursService } from './valeurs/list-indicateur-valeurs.service';
import { ListPlatformDefinitionsService } from './definitions/list-platform-definitions/list-platform-definitions.service';
import { IndicateurSourcesRepository } from './sources/indicateur-sources.repository';
import { HandleDefinitionFichesRepository } from './indicateurs/handle-definition-fiches/handle-definition-fiches.repository';
import { HandleDefinitionPilotesRepository } from './indicateurs/handle-definition-pilotes/handle-definition-pilotes.repository';
import { HandleDefinitionServicesRepository } from './indicateurs/handle-definition-services/handle-definition-services.repository';
import { HandleDefinitionThematiquesRepository } from './indicateurs/handle-definition-thematiques/handle-definition-thematiques.repository';
import { Module } from '@nestjs/common';
import CreateDefinitionService from '@tet/backend/indicateurs/definitions/mutate-definition/create-definition.service';
import { MutateDefinitionRouter } from '@tet/backend/indicateurs/definitions/mutate-definition/mutate-definition.router';
import { IndicateursRouter } from '@tet/backend/indicateurs/indicateurs.router';
import { TrajectoireLeviersController } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.controller';
import { TrajectoireLeviersRouter } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.router';
import ComputeValeursService from '@tet/backend/indicateurs/valeurs/compute-valeurs.service';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { PersonnalisationsModule } from '../collectivites/personnalisations/personnalisations.module';
import { ReferentielsCoreModule } from '../referentiels/referentiels-core.module';
import { UsersModule } from '../users/users.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { IndicateurChartService } from './charts/indicateur-chart.service';
import { ListCollectiviteDefinitionsRepository } from './definitions/list-collectivite-definitions/list-collectivite-definitions.repository';
import { ListPlatformDefinitionsController } from './definitions/list-platform-definitions/list-platform-definitions.controller';
import { ListPlatformDefinitionsRepository } from './definitions/list-platform-definitions/list-platform-definitions.repository';
import { DeleteDefinitionService } from './definitions/mutate-definition/delete-definition.service';
import { UpdateDefinitionService } from './definitions/mutate-definition/update-definition.service';
import { ImportIndicateurDefinitionController } from './import-indicateurs/import-indicateur-definition.controller';
import ImportIndicateurDefinitionService from './import-indicateurs/import-indicateur-definition.service';
import { ExportIndicateursController } from './indicateurs/export-indicateurs/export-indicateurs.controller';
import ExportIndicateursService from './indicateurs/export-indicateurs/export-indicateurs.service';
import { HandleDefinitionFichesService } from './indicateurs/handle-definition-fiches/handle-definition-fiches.service';
import { HandleDefinitionPilotesService } from './indicateurs/handle-definition-pilotes/handle-definition-pilotes.service';
import { HandleDefinitionServicesService } from './indicateurs/handle-definition-services/handle-definition-services.service';
import { HandleDefinitionThematiquesService } from './indicateurs/handle-definition-thematiques/handle-definition-thematiques.service';
import { ListIndicateursController } from './indicateurs/list-indicateurs/list-indicateurs.controller';
import { ListIndicateursRouter } from './indicateurs/list-indicateurs/list-indicateurs.router';
import { ListIndicateursService } from './indicateurs/list-indicateurs/list-indicateurs.service';
import { IndicateurSourcesRouter } from './sources/indicateur-sources.router';
import IndicateurSourcesService from './sources/indicateur-sources.service';
import { TrajectoireLeviersService } from './trajectoire-leviers/trajectoire-leviers.service';
import TrajectoiresDataService from './trajectoires/trajectoires-data.service';
import { VerificationTrajectoireRules } from './trajectoires/verification-trajectoire.rules';
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
  ListIndicateursService,
  ListIndicateursRouter,

  ListPlatformDefinitionsRepository,
  ListCollectiviteDefinitionsRepository,

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
    TrackingModule,
    TransactionModule,
    UsersModule,
    CollectivitesModule,
    SheetModule,
    PersonnalisationsModule,
    ReferentielsCoreModule,
  ],
  providers: [
    MutateDefinitionRepository,
    IndicateurPeriodiciteAvailabilityService,
    IndicateurChartBuilder,
    IndicateurFormulaReconciliationRepository,
    IndicateurFormulaReconciliationService,
    IndicateurFormulaReconciliationRouter,
    WriteIndicateurValeursService,
    ValidateIndicateurValeursWriteService,
    ReconcileIndicateurValeursService,
    IndicateurDefinitionLockRepository,
    IndicateurValeurLockRepository,
    ComputeValeursRepository,
    LoadIndicateurCalculGraphService,
    CrudValeursRepository,
    ListIndicateurValeursService,
    ListPlatformDefinitionsService,
    IndicateurSourcesRepository,
    HandleDefinitionFichesRepository,
    HandleDefinitionPilotesRepository,
    HandleDefinitionServicesRepository,
    HandleDefinitionThematiquesRepository,
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
    IndicateurChartService,
    VerificationTrajectoireRules,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
    TrajectoireLeviersService,
    TrajectoireLeviersRouter,

    ComputeValeursService,
    IndicateursRouter,

    ...DEFINITIONS_PROVIDERS,
  ],
  exports: [
    ListPlatformDefinitionsService,
    ListCollectiviteDefinitionsRepository,
    ListPlatformDefinitionsRepository,
    ListIndicateursService,

    IndicateurExpressionService,
    CrudValeursService,

    ValeursMoyenneService,
    ValeursReferenceService,

    IndicateursRouter,
    IndicateurChartService,
  ],
  controllers: [
    IndicateursValeursController,
    ListIndicateursController,
    ListPlatformDefinitionsController,
    ImportIndicateurDefinitionController,
    ExportIndicateursController,
    TrajectoiresController,
    TrajectoireLeviersController,
  ],
})
export class IndicateursModule {}
