import ActionStatutHistoryService from '@/backend/referentiels/compute-score/action-statut-history.service';
import ScoresAnalysisService from '@/backend/referentiels/compute-score/scores-analysis.service';
import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { PersonnalisationsModule } from '../personnalisations/personnalisations.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { AssignPilotesRouter } from './assign-pilotes/assign-pilotes.router';
import { AssignPilotesService } from './assign-pilotes/assign-pilotes.service';
import { ReferentielsScoringController } from './compute-score/scores.controller';
import ScoresService from './compute-score/scores.service';
import { ExportScoreController } from './export-score/export-score.controller';
import { ExportScoreService } from './export-score/export-score.service';
import { GetReferentielController } from './get-referentiel/get-referentiel.controller';
import { GetReferentielService } from './get-referentiel/get-referentiel.service';
import { ImportReferentielController } from './import-referentiel/import-referentiel.controller';
import { ImportReferentielService } from './import-referentiel/import-referentiel.service';
import { GetLabellisationRouter } from './labellisations/get-labellisation.router';
import { GetLabellisationService } from './labellisations/get-labellisation.service';
import { LabellisationService } from './labellisations/labellisation.service';
import { StartAuditRouter } from './labellisations/start-audit/start-audit.router';
import { StartAuditService } from './labellisations/start-audit/start-audit.service';
import { ValidateAuditRouter } from './labellisations/validate-audit/validate-audit.router';
import { ValidateAuditService } from './labellisations/validate-audit/validate-audit.service';
import { ListActionDefinitionsService } from './list-action-definitions/list-action-definitions.service';
import { ListActionsRouter } from './list-actions/list-actions.router';
import { ReferentielsRouter } from './referentiels.router';
import { ListSnapshotsService } from './snapshots/list-snapshots/list-snapshots.service';
import { SnapshotsRouter } from './snapshots/snapshots.router';
import { SnapshotsService } from './snapshots/snapshots.service';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
import { UpdateActionStatutService } from './update-action-statut/update-action-statut.service';
import { AssignServicesService } from './assign-services/assign-services.service';
import { AssignServicesRouter } from './assign-services/assign-services.router';
@Module({
  imports: [CollectivitesModule, SheetModule, PersonnalisationsModule],
  providers: [
    ActionStatutHistoryService,
    GetReferentielService,
    ImportReferentielService,
    ReferentielsRouter,

    ListActionDefinitionsService,
    ListActionsRouter,

    UpdateActionStatutService,
    UpdateActionStatutRouter,

    ScoresService,
    ExportScoreService,
    ScoresAnalysisService,

    SnapshotsService,
    SnapshotsRouter,
    ListSnapshotsService,

    // Labellisation
    LabellisationService,
    GetLabellisationService,
    GetLabellisationRouter,
    StartAuditService,
    StartAuditRouter,
    ValidateAuditService,
    ValidateAuditRouter,

    AssignPilotesService,
    AssignPilotesRouter,

    AssignServicesService,
    AssignServicesRouter,
  ],
  exports: [ReferentielsRouter],
  controllers: [
    GetReferentielController,
    ImportReferentielController,
    ReferentielsScoringController,
    ExportScoreController,
  ],
})
export class ReferentielsModule {}
