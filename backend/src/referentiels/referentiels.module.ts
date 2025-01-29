import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { PersonnalisationsModule } from '../personnalisations/personnalisations.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { ComputeScoreRouter } from './compute-score/compute-score.router';
import ReferentielsScoringService from './compute-score/referentiels-scoring.service';
import { ReferentielsScoringController } from './controllers/referentiels-scoring.controller';
import { ReferentielsController } from './controllers/referentiels.controller';
import ExportReferentielScoreService from './export-score/export-referentiel-score.service';
import LabellisationService from './services/labellisation.service';
import ReferentielsService from './services/referentiels.service';
import ReferentielsScoringSnapshotsService from './snapshots/referentiels-scoring-snapshots.service';
import { ScoreSnapshotsRouter } from './snapshots/score-snaphots.router';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
import { UpdateActionStatutService } from './update-action-statut/update-action-statut.service';

@Module({
  imports: [
    AuthModule,
    CollectivitesModule,
    SheetModule,
    PersonnalisationsModule,
  ],
  providers: [
    ReferentielsService,
    LabellisationService,
    ReferentielsScoringSnapshotsService,
    ReferentielsScoringService,
    UpdateActionStatutService,
    UpdateActionStatutRouter,
    ComputeScoreRouter,
    ScoreSnapshotsRouter,
    ExportReferentielScoreService,
  ],
  exports: [
    ReferentielsService,
    LabellisationService,
    ReferentielsScoringSnapshotsService,
    ReferentielsScoringService,
    UpdateActionStatutService,
    UpdateActionStatutRouter,
    ComputeScoreRouter,
    ScoreSnapshotsRouter,
    ExportReferentielScoreService,
  ],
  controllers: [ReferentielsController, ReferentielsScoringController],
})
export class ReferentielsModule {}
