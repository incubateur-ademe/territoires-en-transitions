import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { PersonnalisationsModule } from '../personnalisations/personnalisations.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { ComputeScoreRouter } from './compute-score/compute-score.router';
import { ReferentielsScoringController } from './compute-score/referentiels-scoring.controller';
import ReferentielsScoringService from './compute-score/referentiels-scoring.service';
import ExportReferentielScoreService from './export-score/export-referentiel-score.service';
import { GetReferentielController } from './get-referentiel/get-referentiel.controller';
import { GetReferentielService } from './get-referentiel/get-referentiel.service';
import { ImportReferentielController } from './import-referentiel/import-referentiel.controller';
import ImportReferentielService from './import-referentiel/import-referentiel.service';
import { LabellisationService } from './labellisation.service';
import { ListActionDefinitionsService } from './list-action-definitions/list-action-definitions.service';
import { ListActionsRouter } from './list-actions/list-actions.router';
import { ReferentielsRouter } from './referentiels.router';
import { ReferentielsScoringSnapshotsService } from './snapshots/referentiels-scoring-snapshots.service';
import { ScoreSnapshotsRouter } from './snapshots/score-snaphots.router';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
import { UpdateActionStatutService } from './update-action-statut/update-action-statut.service';

@Module({
  imports: [CollectivitesModule, SheetModule, PersonnalisationsModule],
  providers: [
    GetReferentielService,

    ListActionDefinitionsService,
    ListActionsRouter,

    UpdateActionStatutService,
    UpdateActionStatutRouter,

    LabellisationService,
    ReferentielsScoringSnapshotsService,

    ReferentielsScoringService,
    ComputeScoreRouter,
    ScoreSnapshotsRouter,
    ReferentielsRouter,
    ExportReferentielScoreService,
    ImportReferentielService,
  ],
  exports: [
    ReferentielsRouter,
    LabellisationService,
    ReferentielsScoringSnapshotsService,
    ReferentielsScoringService,
    UpdateActionStatutService,
    ExportReferentielScoreService,
  ],
  controllers: [
    GetReferentielController,
    ImportReferentielController,
    ReferentielsScoringController,
  ],
})
export class ReferentielsModule {}
