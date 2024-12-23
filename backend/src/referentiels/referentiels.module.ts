import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { PersonnalisationsModule } from '../personnalisations/personnalisations.module';
import { ConfigurationModule } from '../utils/config/configuration.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { ComputeScoreRouter } from './compute-score/compute-score.router';
import { ReferentielsScoringController } from './controllers/referentiels-scoring.controller';
import { ReferentielsController } from './controllers/referentiels.controller';
import LabellisationService from './services/labellisation.service';
import ReferentielsScoringSnapshotsService from './services/referentiels-scoring-snapshots.service';
import ReferentielsScoringService from './services/referentiels-scoring.service';
import ReferentielsService from './services/referentiels.service';
import { ScoreSnapshotsRouter } from './snapshots/score-snaphots.router';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
import { UpdateActionStatutService } from './update-action-statut/update-action-statut.service';

@Module({
  imports: [
    AuthModule,
    CollectivitesModule,
    CommonModule,
    ConfigurationModule,
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
  ],
  controllers: [ReferentielsController, ReferentielsScoringController],
})
export class ReferentielsModule {}
