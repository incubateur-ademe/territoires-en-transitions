import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import CreateIndicateurService from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/create-indicateur.service';
import { MutateIndicateurRouter } from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/mutate-indicateur.router';
import { IndicateursRouter } from '@tet/backend/indicateurs/indicateurs.router';
import { TrajectoireLeviersController } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.controller';
import { TrajectoireLeviersRouter } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.router';
import ComputeValeursService from '@tet/backend/indicateurs/valeurs/compute-indicateur-valeurs/compute-valeurs.service';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { PersonnalisationsModule } from '../collectivites/personnalisations/personnalisations.module';
import { AxeModule } from '../plans/axes/axe.module';
import { FichesModule } from '../plans/fiches/fiches.module';
import { ReferentielsCoreModule } from '../referentiels/referentiels-core.module';
import { UsersModule } from '../users/users.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { TransactionModule } from '../utils/transaction/transaction.module';
import { TrackingModule } from '../utils/tracking/tracking.module';
import { IndicateurChartBuilder } from './charts/indicateur-chart.builder';
import { IndicateurChartService } from './charts/indicateur-chart.service';
import { IndicateurLockRepository } from './indicateur/indicateur-lock.repository';
import { AddIndicateurLinksService } from './indicateurs/add-indicateur-links/add-indicateur-links.service';
import { ListCollectiviteIndicateursModule } from './indicateurs/list-collectivite-indicateurs/list-collectivite-indicateurs.module';
import { ListIndicateursPredefinisController } from './indicateurs/list-indicateurs-predefinis/list-indicateurs-predefinis.controller';
import { ListIndicateursPredefinisRepository } from './indicateurs/list-indicateurs-predefinis/list-indicateurs-predefinis.repository';
import { ListIndicateursPredefinisService } from './indicateurs/list-indicateurs-predefinis/list-indicateurs-predefinis.service';
import { DeleteIndicateurService } from './indicateurs/mutate-indicateur/delete-indicateur.service';
import { MutateIndicateurRepository } from './indicateurs/mutate-indicateur/mutate-indicateur.repository';
import { UpdateIndicateurService } from './indicateurs/mutate-indicateur/update-indicateur.service';
import { ImportIndicateurDefinitionController } from './import-indicateurs/import-indicateur-definition.controller';
import ImportIndicateurDefinitionService from './import-indicateurs/import-indicateur-definition.service';
import { ImportIndicateurDefinitionRepository } from './import-indicateurs/import-indicateur-definition.repository';
import { ImportIndicateurRelationsService } from './import-indicateurs/import-indicateur-relations.service';
import { UpsertIndicateurDefinitionsService } from './import-indicateurs/upsert-indicateur-definitions.service';
import { ExportIndicateursController } from './indicateurs/export-indicateurs/export-indicateurs.controller';
import ExportIndicateursService from './indicateurs/export-indicateurs/export-indicateurs.service';
import { UpsertIndicateurFichesRepository } from './indicateurs/upsert-indicateur-fiches/upsert-indicateur-fiches.repository';
import { UpsertIndicateurFichesService } from './indicateurs/upsert-indicateur-fiches/upsert-indicateur-fiches.service';
import { UpsertIndicateurPilotesRepository } from './indicateurs/upsert-indicateur-pilotes/upsert-indicateur-pilotes.repository';
import { UpsertIndicateurPilotesService } from './indicateurs/upsert-indicateur-pilotes/upsert-indicateur-pilotes.service';
import { UpsertIndicateurServicesRepository } from './indicateurs/upsert-indicateur-services/upsert-indicateur-services.repository';
import { UpsertIndicateurServicesService } from './indicateurs/upsert-indicateur-services/upsert-indicateur-services.service';
import { UpsertIndicateurThematiquesRepository } from './indicateurs/upsert-indicateur-thematiques/upsert-indicateur-thematiques.repository';
import { UpsertIndicateurThematiquesService } from './indicateurs/upsert-indicateur-thematiques/upsert-indicateur-thematiques.service';
import { ListIndicateursController } from './indicateurs/list-indicateurs/list-indicateurs.controller';
import { ListIndicateursRepository } from './indicateurs/list-indicateurs/list-indicateurs.repository';
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
import { EnqueueImportTrajectoireSnbc3Service } from './trajectoires/import-snbc3/enqueue-import-trajectoire-snbc3.service';
import {
  IMPORT_TRAJECTOIRE_SNBC3_JOB_OPTIONS,
  IMPORT_TRAJECTOIRE_SNBC3_QUEUE_NAME,
} from './trajectoires/import-snbc3/import-trajectoire-snbc3.queue';
import { ImportTrajectoireSnbc3Router } from './trajectoires/import-snbc3/import-trajectoire-snbc3.router';
import { ImportTrajectoireSnbc3Service } from './trajectoires/import-snbc3/import-trajectoire-snbc3.service';
import { ImportTrajectoireSnbc3Worker } from './trajectoires/import-snbc3/import-trajectoire-snbc3.worker';
import { Snbc3ReleaseStorageService } from './trajectoires/import-snbc3/snbc3-release-storage.service';
import {
  GitlabSnbc3ArtifactReader,
  LocalSnbc3ArtifactReader,
  Snbc3ArtifactReader,
} from './trajectoires/import-snbc3/snbc3-artifact.reader';
import { TrajectoireSnbc3FeatureFlagService } from './trajectoires/trajectoire-snbc3-feature-flag.service';
import { Snbc3SourceMetadonneeRepository } from './trajectoires/import-snbc3/snbc3-source-metadonnee.repository';
import { TrajectoireSnbc3Repository } from './trajectoires/snbc3/trajectoire-snbc3.repository';
import { TrajectoireSnbc3Router } from './trajectoires/snbc3/trajectoire-snbc3.router';
import { TrajectoireSnbc3Service } from './trajectoires/snbc3/trajectoire-snbc3.service';
import ConfigurationService from '../utils/config/configuration.service';
import { IndicateursValeursController } from './valeurs/indicateur-valeurs.controller';
import { IndicateurValeursRouter } from './valeurs/indicateur-valeurs.router';
import { IndicateurValeursRepository } from './valeurs/indicateur-valeurs.repository';
import ManageIndicateurValeursService from './valeurs/manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { ComputeValeursRepository } from './valeurs/compute-indicateur-valeurs/compute-valeurs.repository';
import { LoadIndicateurCalculGraphService } from './valeurs/compute-indicateur-valeurs/load-indicateur-calcul-graph.service';
import { ListIndicateurValeursService } from './valeurs/list-indicateur-valeurs/list-indicateur-valeurs.service';
import { ValidateIndicateurValeursWriteService } from './valeurs/write-indicateur-valeurs/validate-indicateur-valeurs-write.service';
import { WriteIndicateurValeursService } from './valeurs/write-indicateur-valeurs/write-indicateur-valeurs.service';
import { ReconcileIndicateurValeursService } from './valeurs/reconcile-indicateur-valeurs/reconcile-indicateur-valeurs.service';
import { IndicateurValeurLockRepository } from './valeurs/indicateur-valeur-lock.repository';
import ValeursMoyenneService from './valeurs/get-moyenne-indicateur-valeurs/valeurs-moyenne.service';
import ValeursReferenceService from './valeurs/get-valeurs-reference/valeurs-reference.service';
import { UpsertGridValeursRepository } from './valeurs/upsert-grid-valeurs.repository';
import { UpsertGridValeursService } from './valeurs/upsert-grid-valeurs.service';
import { IndicateurVuesRepository } from './vues/indicateur-vues.repository';
import { IndicateurVuesRouter } from './vues/indicateur-vues.router';
import { IndicateurVuesService } from './vues/indicateur-vues.service';

// Sub-domain indicateurs.definitions
const DEFINITIONS_PROVIDERS = [
  AddIndicateurLinksService,
  ListIndicateursRepository,
  ListIndicateursService,
  ListIndicateursRouter,

  ListIndicateursPredefinisRepository,
  ListIndicateursPredefinisService,
  IndicateurLockRepository,

  CreateIndicateurService,
  UpdateIndicateurService,
  DeleteIndicateurService,
  MutateIndicateurRepository,
  MutateIndicateurRouter,

  UpsertIndicateurPilotesService,
  UpsertIndicateurPilotesRepository,
  UpsertIndicateurServicesService,
  UpsertIndicateurServicesRepository,
  UpsertIndicateurThematiquesService,
  UpsertIndicateurThematiquesRepository,
  UpsertIndicateurFichesService,
  UpsertIndicateurFichesRepository,
];

@Module({
  imports: [
    AxeModule,
    UsersModule,
    CollectivitesModule,
    SheetModule,
    TransactionModule,
    TrackingModule,
    PersonnalisationsModule,
    FichesModule,
    ReferentielsCoreModule,
    ListCollectiviteIndicateursModule,
    BullModule.registerQueue({
      name: IMPORT_TRAJECTOIRE_SNBC3_QUEUE_NAME,
      defaultJobOptions: IMPORT_TRAJECTOIRE_SNBC3_JOB_OPTIONS,
    }),
  ],
  providers: [
    ExportIndicateursService,
    IndicateurSourcesService,
    IndicateurSourcesRepository,
    IndicateurExpressionService,
    ManageIndicateurValeursService,
    IndicateurValeursRepository,
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
    ImportTrajectoireSnbc3Router,
    EnqueueImportTrajectoireSnbc3Service,
    ImportTrajectoireSnbc3Service,
    ImportTrajectoireSnbc3Worker,
    Snbc3ReleaseStorageService,
    TrajectoireSnbc3FeatureFlagService,
    Snbc3SourceMetadonneeRepository,
    TrajectoireSnbc3Repository,
    TrajectoireSnbc3Service,
    TrajectoireSnbc3Router,
    {
      provide: Snbc3ArtifactReader,
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => {
        const localRepository = config.get(
          'TRAJECTOIRE_SNBC3_LOCAL_REPOSITORY'
        );
        return localRepository
          ? new LocalSnbc3ArtifactReader(localRepository)
          : new GitlabSnbc3ArtifactReader({
              repositoryUrl: config.get('TRAJECTOIRE_SNBC3_REPOSITORY_URL'),
              token: config.get('TRAJECTOIRE_SNBC3_GITLAB_TOKEN'),
            });
      },
    },

    ComputeValeursService,
    ComputeValeursRepository,
    LoadIndicateurCalculGraphService,
    IndicateursRouter,

    IndicateurVuesRepository,
    IndicateurVuesService,
    IndicateurVuesRouter,

    ...DEFINITIONS_PROVIDERS,
  ],
  exports: [
    AddIndicateurLinksService,
    CreateIndicateurService,
    IndicateurLockRepository,
    IndicateurSourcesService,
    ListIndicateursPredefinisService,
    ListIndicateursPredefinisRepository,
    ListIndicateursService,
    UpdateIndicateurService,

    IndicateurExpressionService,
    ManageIndicateurValeursService,

    ValeursMoyenneService,
    ValeursReferenceService,

    IndicateursRouter,
    IndicateurChartBuilder,
    IndicateurChartService,
    TrajectoireSnbc3FeatureFlagService,
  ],
  controllers: [
    IndicateursValeursController,
    ListIndicateursController,
    ListIndicateursPredefinisController,
    ImportIndicateurDefinitionController,
    ExportIndicateursController,
    TrajectoiresController,
    TrajectoireLeviersController,
  ],
})
export class IndicateursModule {}
