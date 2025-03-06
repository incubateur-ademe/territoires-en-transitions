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
import { GetLabellisationRouter } from './labellisations/get-labellisation.router';
import { LabellisationService } from './labellisations/labellisation.service';
import { StartAuditRouter } from './labellisations/start-audit/start-audit.router';
import { StartAuditService } from './labellisations/start-audit/start-audit.service';
import { ValidateAuditRouter } from './labellisations/validate-audit/validate-audit.router';
import { ValidateAuditService } from './labellisations/validate-audit/validate-audit.service';
import { ListActionDefinitionsService } from './list-action-definitions/list-action-definitions.service';
import { ListActionsRouter } from './list-actions/list-actions.router';
import { ReferentielsRouter } from './referentiels.router';
import { SnapshotsRouter } from './snapshots/snaphots.router';
import { SnapshotsService } from './snapshots/snapshots.service';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
import { UpdateActionStatutService } from './update-action-statut/update-action-statut.service';

@Module({
  imports: [CollectivitesModule, SheetModule, PersonnalisationsModule],
  providers: [
    GetReferentielService,
    ImportReferentielService,

    ListActionDefinitionsService,
    ListActionsRouter,

    UpdateActionStatutService,
    UpdateActionStatutRouter,

    // Labellisation
    LabellisationService,
    GetLabellisationRouter,
    StartAuditService,
    StartAuditRouter,
    ValidateAuditService,
    ValidateAuditRouter,

    SnapshotsService,
    SnapshotsRouter,

    ScoresService,
    ExportScoreService,
    ComputeScoreRouter,

    ReferentielsRouter,
  ],
  exports: [ReferentielsRouter],
  controllers: [
    GetReferentielController,
    ImportReferentielController,
    ReferentielsScoringController,
  ],
})
export class ReferentielsModule {}
