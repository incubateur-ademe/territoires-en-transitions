import { IndicateursModule } from '@/backend/indicateurs/indicateurs.module';
import { FichesModule } from '@/backend/plans/fiches/fiches.module';
import ActionStatutHistoryService from '@/backend/referentiels/compute-score/action-statut-history.service';
import { ListLabellisationsController } from '@/backend/referentiels/labellisations/list-labellisations.controller';
import { ListLabellisationsService } from '@/backend/referentiels/labellisations/list-labellisations.service';
import { ScoreIndicatifRouter } from '@/backend/referentiels/score-indicatif/score-indicatif.router';
import { ScoreIndicatifService } from '@/backend/referentiels/score-indicatif/score-indicatif.service';
import { ListSnapshotsController } from '@/backend/referentiels/snapshots/list-snapshots/list-snapshots.controller';
import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { PersonnalisationsModule } from '../personnalisations/personnalisations.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import ScoresService from './compute-score/scores.service';

import { ExportScoreComparisonBaseService } from '@/backend/referentiels/export-score/export-score-comparison-base.service';
import { ExportScoreComparisonScoreIndicatifService } from '@/backend/referentiels/export-score/export-score-comparison-score-indicatif.service';
import { ExportScoreComparisonController } from './export-score/export-score-comparison.controller';
import { ExportScoreComparisonService } from './export-score/export-score-comparison.service';
import { GetReferentielController } from './get-referentiel/get-referentiel.controller';
import { GetReferentielService } from './get-referentiel/get-referentiel.service';
import { HandleMesurePilotesRouter } from './handle-mesure-pilotes/handle-mesure-pilotes.router';
import { HandleMesurePilotesService } from './handle-mesure-pilotes/handle-mesure-pilotes.service';
import { HandleMesuresServicesRouter } from './handle-mesure-services/handle-mesure-services.router';
import { HandleMesureServicesService } from './handle-mesure-services/handle-mesure-services.service';
import { ImportReferentielController } from './import-referentiel/import-referentiel.controller';
import { ImportReferentielService } from './import-referentiel/import-referentiel.service';
import { GetLabellisationRouter } from './labellisations/get-labellisation.router';
import { GetLabellisationService } from './labellisations/get-labellisation.service';
import { LabellisationService } from './labellisations/labellisation.service';
import { StartAuditRouter } from './labellisations/start-audit/start-audit.router';
import { StartAuditService } from './labellisations/start-audit/start-audit.service';
import { ValidateAuditRouter } from './labellisations/validate-audit/validate-audit.router';
import { ValidateAuditService } from './labellisations/validate-audit/validate-audit.service';
import { ListActionsRouter } from './list-actions/list-actions.router';
import { ListActionsService } from './list-actions/list-actions.service';
import { ReferentielsRouter } from './referentiels.router';
import { ListSnapshotsService } from './snapshots/list-snapshots/list-snapshots.service';
import { SnapshotsRouter } from './snapshots/snapshots.router';
import { SnapshotsService } from './snapshots/snapshots.service';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
import { UpdateActionStatutService } from './update-action-statut/update-action-statut.service';
@Module({
  imports: [
    CollectivitesModule,
    SheetModule,
    PersonnalisationsModule,
    IndicateursModule,
    FichesModule,
  ],
  providers: [
    ActionStatutHistoryService,
    GetReferentielService,
    ImportReferentielService,
    ReferentielsRouter,

    ListActionsService,
    ListActionsRouter,

    UpdateActionStatutService,
    UpdateActionStatutRouter,

    ScoresService,
    ExportScoreComparisonService,
    ExportScoreComparisonBaseService,
    ExportScoreComparisonScoreIndicatifService,

    SnapshotsService,
    SnapshotsRouter,
    ListSnapshotsService,

    // Labellisation
    LabellisationService,
    ListLabellisationsService,
    GetLabellisationService,
    GetLabellisationRouter,
    StartAuditService,
    StartAuditRouter,
    ValidateAuditService,
    ValidateAuditRouter,

    HandleMesurePilotesService,
    HandleMesurePilotesRouter,

    HandleMesureServicesService,
    HandleMesuresServicesRouter,

    ScoreIndicatifService,
    ScoreIndicatifRouter,
  ],
  exports: [ListLabellisationsService, ListActionsService, ReferentielsRouter],
  controllers: [
    GetReferentielController,
    ListSnapshotsController,
    ListLabellisationsController,
    ImportReferentielController,
    ExportScoreComparisonController,
  ],
})
export class ReferentielsModule {}
