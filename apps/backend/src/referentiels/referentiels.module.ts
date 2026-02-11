import { Module } from '@nestjs/common';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import ActionStatutHistoryService from '@tet/backend/referentiels/compute-score/action-statut-history.service';
import { ReferentielsScoringController } from '@tet/backend/referentiels/compute-score/scores.controller';
import { LoadScoreComparisonService } from '@tet/backend/referentiels/export-score/load-score-comparison.service';
import ImportPreuveReglementaireDefinitionService from '@tet/backend/referentiels/import-preuve-reglementaire-definitions/import-preuve-reglementaire-definition.service';
import { ListLabellisationsController } from '@tet/backend/referentiels/labellisations/list-labellisations.controller';
import { ListLabellisationsService } from '@tet/backend/referentiels/labellisations/list-labellisations.service';
import { ScoreIndicatifRouter } from '@tet/backend/referentiels/score-indicatif/score-indicatif.router';
import { ScoreIndicatifService } from '@tet/backend/referentiels/score-indicatif/score-indicatif.service';
import { ListSnapshotsController } from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.controller';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { PersonnalisationsModule } from '../collectivites/personnalisations/personnalisations.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import ScoresService from './compute-score/scores.service';
import { GetReferentielDefinitionRouter } from './definitions/get-referentiel-definition/get-referentiel-definition.router';
import { GetReferentielDefinitionService } from './definitions/get-referentiel-definition/get-referentiel-definition.service';
import { GetReferentielController } from './definitions/get-referentiel-definition/get-referentiel.controller';
import { ExportScoreComparisonController } from './export-score/export-score-comparison.controller';
import { ExportScoreComparisonService } from './export-score/export-score-comparison.service';
import { GetReferentielService } from './get-referentiel/get-referentiel.service';
import { HandleMesurePilotesRouter } from './handle-mesure-pilotes/handle-mesure-pilotes.router';
import { HandleMesurePilotesService } from './handle-mesure-pilotes/handle-mesure-pilotes.service';
import { HandleMesuresServicesRouter } from './handle-mesure-services/handle-mesure-services.router';
import { HandleMesureServicesService } from './handle-mesure-services/handle-mesure-services.service';
import { ImportReferentielController } from './import-referentiel/import-referentiel.controller';
import { ImportReferentielService } from './import-referentiel/import-referentiel.service';
import { CreatePreuveRouter } from './labellisations/create-preuve/create-preuve.router';
import { CreatePreuveService } from './labellisations/create-preuve/create-preuve.service';
import { GetAuditEnCoursRepository } from './labellisations/get-audit-en-cours/get-audit-en-cours.repository';
import { GetLabellisationRouter } from './labellisations/get-labellisation.router';
import { GetLabellisationService } from './labellisations/get-labellisation.service';
import { HandleMesureAuditStatutRouter } from './labellisations/handle-mesure-audit-statut/handle-mesure-audit-statut.router';
import { HandleMesureAuditStatutService } from './labellisations/handle-mesure-audit-statut/handle-mesure-audit-statut.service';
import { LabellisationService } from './labellisations/labellisation.service';
import { ListPreuvesRouter } from './labellisations/list-preuves/list-preuves.router';
import { ListPreuvesService } from './labellisations/list-preuves/list-preuves.service';
import { RequestLabellisationRouter } from './labellisations/request-labellisation/request-labellisation.router';
import { RequestLabellisationService } from './labellisations/request-labellisation/request-labellisation.service';
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
import { UpdateActionCommentaireRouter } from './update-action-commentaire/update-action-commentaire.router';
import { UpdateActionCommentaireService } from './update-action-commentaire/update-action-commentaire.service';
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
    GetReferentielDefinitionService,
    GetReferentielDefinitionRouter,
    ImportReferentielService,
    ImportPreuveReglementaireDefinitionService,
    ReferentielsRouter,

    ListActionsService,
    ListActionsRouter,

    UpdateActionStatutService,
    UpdateActionStatutRouter,
    UpdateActionCommentaireService,
    UpdateActionCommentaireRouter,

    ScoresService,
    ExportScoreComparisonService,
    LoadScoreComparisonService,

    SnapshotsService,
    SnapshotsRouter,
    ListSnapshotsService,

    // Labellisation
    LabellisationService,
    ListLabellisationsService,
    GetLabellisationService,
    GetLabellisationRouter,
    GetAuditEnCoursRepository,
    StartAuditService,
    StartAuditRouter,
    RequestLabellisationService,
    RequestLabellisationRouter,
    CreatePreuveService,
    CreatePreuveRouter,
    ListPreuvesService,
    ListPreuvesRouter,
    ValidateAuditService,
    ValidateAuditRouter,
    HandleMesureAuditStatutService,
    HandleMesureAuditStatutRouter,

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
    ReferentielsScoringController,
  ],
})
export class ReferentielsModule {}
