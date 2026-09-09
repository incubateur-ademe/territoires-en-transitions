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
import { TransactionModule } from '../utils/transaction/transaction.module';
import { TrackingModule } from '../utils/tracking/tracking.module';
import { IndicateurChartBuilder } from './charts/indicateur-chart.builder';
import { IndicateurChartService } from './charts/indicateur-chart.service';
import { IndicateurDefinitionLockRepository } from './definitions/indicateur-definition-lock.repository';
import { IndicateurFormulaReconciliationRepository } from './definitions/indicateur-formula-reconciliation.repository';
import { IndicateurFormulaReconciliationRouter } from './definitions/indicateur-formula-reconciliation.router';
import { IndicateurFormulaReconciliationService } from './definitions/indicateur-formula-reconciliation.service';
import { ListCollectiviteDefinitionsRepository } from './definitions/list-collectivite-definitions/list-collectivite-definitions.repository';
import { ListPlatformDefinitionsController } from './definitions/list-platform-definitions/list-platform-definitions.controller';
import { ListPlatformDefinitionsRepository } from './definitions/list-platform-definitions/list-platform-definitions.repository';
import { ListPlatformDefinitionsService } from './definitions/list-platform-definitions/list-platform-definitions.service';
import { DeleteDefinitionService } from './definitions/mutate-definition/delete-definition.service';
import { IndicateurPeriodiciteAvailabilityService } from './definitions/indicateur-periodicite-availability.service';
import { MutateDefinitionRepository } from './definitions/mutate-definition/mutate-definition.repository';
import { UpdateDefinitionService } from './definitions/mutate-definition/update-definition.service';
import { ImportIndicateurDefinitionController } from './import-indicateurs/import-indicateur-definition.controller';
import { ImportIndicateurDefinitionRepository } from './import-indicateurs/import-indicateur-definition.repository';
import ImportIndicateurDefinitionService from './import-indicateurs/import-indicateur-definition.service';
import { ImportIndicateurRelationsService } from './import-indicateurs/import-indicateur-relations.service';
import { UpsertIndicateurDefinitionsService } from './import-indicateurs/upsert-indicateur-definitions.service';
import { ExportIndicateursController } from './indicateurs/export-indicateurs/export-indicateurs.controller';
import ExportIndicateursService from './indicateurs/export-indicateurs/export-indicateurs.service';
import { HandleDefinitionFichesRepository } from './indicateurs/handle-definition-fiches/handle-definition-fiches.repository';
import { HandleDefinitionFichesService } from './indicateurs/handle-definition-fiches/handle-definition-fiches.service';
import { HandleDefinitionPilotesRepository } from './indicateurs/handle-definition-pilotes/handle-definition-pilotes.repository';
import { HandleDefinitionPilotesService } from './indicateurs/handle-definition-pilotes/handle-definition-pilotes.service';
import { HandleDefinitionServicesRepository } from './indicateurs/handle-definition-services/handle-definition-services.repository';
import { HandleDefinitionServicesService } from './indicateurs/handle-definition-services/handle-definition-services.service';
import { HandleDefinitionThematiquesRepository } from './indicateurs/handle-definition-thematiques/handle-definition-thematiques.repository';
import { HandleDefinitionThematiquesService } from './indicateurs/handle-definition-thematiques/handle-definition-thematiques.service';
import { ListIndicateursController } from './indicateurs/list-indicateurs/list-indicateurs.controller';
import { ListIndicateursRouter } from './indicateurs/list-indicateurs/list-indicateurs.router';
import { ListIndicateursService } from './indicateurs/list-indicateurs/list-indicateurs.service';
import { IndicateurSourcesRouter } from './sources/indicateur-sources.router';
import { IndicateurSourcesRepository } from './sources/indicateur-sources.repository';
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
import { CrudValeursRepository } from './valeurs/crud-valeurs.repository';
import CrudValeursService from './valeurs/crud-valeurs.service';
import { ComputeValeursRepository } from './valeurs/compute-valeurs.repository';
import { LoadIndicateurCalculGraphService } from './valeurs/load-indicateur-calcul-graph.service';
import { ListIndicateurValeursService } from './valeurs/list-indicateur-valeurs.service';
import { ValidateIndicateurValeursWriteService } from './valeurs/validate-indicateur-valeurs-write.service';
import { WriteIndicateurValeursService } from './valeurs/write-indicateur-valeurs.service';
import { ReconcileIndicateurValeursService } from './valeurs/reconcile-indicateur-valeurs.service';
import { IndicateurValeurLockRepository } from './valeurs/indicateur-valeur-lock.repository';
import { UpsertGridValeursRepository } from './valeurs/upsert-grid-valeurs.repository';
import { UpsertGridValeursService } from './valeurs/upsert-grid-valeurs.service';
import ValeursMoyenneService from './valeurs/valeurs-moyenne.service';
import ValeursReferenceService from './valeurs/valeurs-reference.service';

// Sub-domain indicateurs.definitions
const DEFINITIONS_PROVIDERS = [
  ListIndicateursService,
  ListIndicateursRouter,

  ListPlatformDefinitionsRepository,
  ListPlatformDefinitionsService,
  ListCollectiviteDefinitionsRepository,
  IndicateurDefinitionLockRepository,
  IndicateurFormulaReconciliationRepository,
  IndicateurFormulaReconciliationService,
  IndicateurFormulaReconciliationRouter,

  CreateDefinitionService,
  UpdateDefinitionService,
  DeleteDefinitionService,
  MutateDefinitionRepository,
  IndicateurPeriodiciteAvailabilityService,
  MutateDefinitionRouter,

  HandleDefinitionPilotesService,
  HandleDefinitionPilotesRepository,
  HandleDefinitionServicesService,
  HandleDefinitionServicesRepository,
  HandleDefinitionThematiquesService,
  HandleDefinitionThematiquesRepository,
  HandleDefinitionFichesService,
  HandleDefinitionFichesRepository,
];

@Module({
  imports: [
    UsersModule,
    CollectivitesModule,
    SheetModule,
    TransactionModule,
    TrackingModule,
    PersonnalisationsModule,
    ReferentielsCoreModule,
  ],
  providers: [
    ExportIndicateursService,
    IndicateurSourcesService,
    IndicateurSourcesRepository,
    IndicateurExpressionService,
    CrudValeursService,
    CrudValeursRepository,
    ListIndicateurValeursService,
    ValidateIndicateurValeursWriteService,
    WriteIndicateurValeursService,
    ReconcileIndicateurValeursService,
    IndicateurValeurLockRepository,
    UpsertGridValeursRepository,
    UpsertGridValeursService,
    ImportIndicateurDefinitionService,
    ImportIndicateurDefinitionRepository,
    ImportIndicateurRelationsService,
    UpsertIndicateurDefinitionsService,
    ValeursMoyenneService,
    ValeursReferenceService,

    IndicateurValeursRouter,
    IndicateurSourcesRouter,
    IndicateurChartBuilder,
    IndicateurChartService,
    VerificationTrajectoireRules,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
    TrajectoireLeviersService,
    TrajectoireLeviersRouter,

    ComputeValeursService,
    ComputeValeursRepository,
    LoadIndicateurCalculGraphService,
    IndicateursRouter,

    ...DEFINITIONS_PROVIDERS,
  ],
  exports: [
    ListPlatformDefinitionsService,
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
