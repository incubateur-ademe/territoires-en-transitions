import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { PersonnalisationsModule } from '../personnalisations/personnalisations.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { ComputeScoreRouter } from './compute-score/compute-score.router';
import { ReferentielsScoringController } from './compute-score/scores.controller';
import ScoresService from './compute-score/scores.service';
import ExportScoreService from './export-score/export-score.service';
import { GetReferentielController } from './get-referentiel/get-referentiel.controller';
import { GetReferentielService } from './get-referentiel/get-referentiel.service';
import { ImportReferentielController } from './import-referentiel/import-referentiel.controller';
import ImportReferentielService from './import-referentiel/import-referentiel.service';
import { LabellisationService } from './labellisation.service';
import { ListActionDefinitionsService } from './list-action-definitions/list-action-definitions.service';
import { ListActionsRouter } from './list-actions/list-actions.router';
import { ReferentielsRouter } from './referentiels.router';
import { SnapshotsRouter } from './snapshots/snaphots.router';
import { SnapshotsService } from './snapshots/snapshots.service';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
import { UpdateActionStatutService } from './update-action-statut/update-action-statut.service';
import { AssignPilotesRouter } from './assign-pilotes/assign-pilotes.router';
import { AssignPilotesService } from './assign-pilotes/assign-pilotes.service';
@Module({
  imports: [CollectivitesModule, SheetModule, PersonnalisationsModule],
  providers: [
    GetReferentielService,

    ListActionDefinitionsService,
    ListActionsRouter,

    UpdateActionStatutService,
    UpdateActionStatutRouter,

    LabellisationService,
    SnapshotsService,

    ScoresService,
    ComputeScoreRouter,
    SnapshotsRouter,
    ReferentielsRouter,
    ExportScoreService,
    ImportReferentielService,

    AssignPilotesService,
    AssignPilotesRouter,
  ],
  exports: [
    ReferentielsRouter,
    LabellisationService,
    SnapshotsService,
    ScoresService,
    UpdateActionStatutService,
    ExportScoreService,
  ],
  controllers: [
    GetReferentielController,
    ImportReferentielController,
    ReferentielsScoringController,
  ],
})
export class ReferentielsModule {}
