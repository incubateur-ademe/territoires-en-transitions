import { Injectable } from '@nestjs/common';
import { ScoreIndicatifRouter } from '@tet/backend/referentiels/score-indicatif/score-indicatif.router';
import { TrpcService } from '../utils/trpc/trpc.service';
import { ActionPersonnalisationsRouter } from './action-personnalisations/action-personnalisations.router';
import { AddPreuveRouter } from './add-preuve/add-preuve.router';
import { CountPreuvesRouter } from './count-preuve/count-preuves.router';
import { GetReferentielDefinitionRouter } from './definitions/get-referentiel-definition/get-referentiel-definition.router';
import { ListDocumentsRouter } from './documents/list-documents/list-documents.router';
import { HandleMesurePilotesRouter } from './handle-mesure-pilotes/handle-mesure-pilotes.router';
import { HandleMesuresServicesRouter } from './handle-mesure-services/handle-mesure-services.router';
import { HistoriqueRouter } from './historique/historique.router';
import { CreatePreuveRouter } from './labellisations/create-preuve/create-preuve.router';
import { GetLabellisationRouter } from './labellisations/get-labellisation.router';
import { HandleMesureAuditStatutRouter } from './labellisations/handle-mesure-audit-statut/handle-mesure-audit-statut.router';
import { ListPreuvesRouter } from './labellisations/list-preuves/list-preuves.router';
import { RequestLabellisationRouter } from './labellisations/request-labellisation/request-labellisation.router';
import { StartAuditRouter } from './labellisations/start-audit/start-audit.router';
import { UpdateAuditReportRouter } from './labellisations/update-audit-report/update-audit-report.router';
import { ValidateAuditRouter } from './labellisations/validate-audit/validate-audit.router';
import { ListActionsRouter } from './list-actions/list-actions.router';
import { GetPreuvesArchiveRouter } from './preuves-archive/get-preuves-archive/get-preuves-archive.router';
import { ListPreuvesArchiveRouter } from './preuves-archive/list-preuves-archive/list-preuves-archive.router';
import { RequestPreuvesArchiveRouter } from './preuves-archive/request-preuves-archive/request-preuves-archive.router';
import { ResetDisplayPreferencesRouter } from './reset-display-preferences/reset-display-preferences.router';
import { SnapshotsRouter } from './snapshots/snapshots.router';
import { SwitchToTeRouter } from './switch-to-te/switch-to-te.router';
import { UpdateActionCommentaireRouter } from './update-action-commentaire/update-action-commentaire.router';
import { UpdateActionFichesRouter } from './update-action-fiches/update-action-fiches.router';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
@Injectable()
export class ReferentielsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addPreuveRouter: AddPreuveRouter,
    private readonly updateActionStatutRouter: UpdateActionStatutRouter,
    private readonly updateActionCommentaireRouter: UpdateActionCommentaireRouter,
    private readonly updateActionFichesRouter: UpdateActionFichesRouter,
    private readonly listActionStatutRouter: ListActionsRouter,
    private readonly countPreuvesRouter: CountPreuvesRouter,
    private readonly scoreSnapshotsRouter: SnapshotsRouter,
    private readonly getLabellisation: GetLabellisationRouter,
    private readonly startAudit: StartAuditRouter,
    private readonly requestLabellisation: RequestLabellisationRouter,
    private readonly createPreuve: CreatePreuveRouter,
    private readonly validateAudit: ValidateAuditRouter,
    private readonly listPreuves: ListPreuvesRouter,
    private readonly listDocumentsRouter: ListDocumentsRouter,
    private readonly updateAuditReport: UpdateAuditReportRouter,
    private readonly assignPilotesRouter: HandleMesurePilotesRouter,
    private readonly assignServicesRouter: HandleMesuresServicesRouter,
    private readonly scoreIndicatifRouter: ScoreIndicatifRouter,
    private readonly actionPersonnalisationsRouter: ActionPersonnalisationsRouter,
    private readonly handleMesureAuditStatutRouter: HandleMesureAuditStatutRouter,
    private readonly getReferentielDefinitionRouter: GetReferentielDefinitionRouter,
    private readonly resetDisplayPreferencesRouter: ResetDisplayPreferencesRouter,
    private readonly historiqueRouter: HistoriqueRouter,
    private readonly requestPreuvesArchiveRouter: RequestPreuvesArchiveRouter,
    private readonly getPreuvesArchiveRouter: GetPreuvesArchiveRouter,
    private readonly listPreuvesArchiveRouter: ListPreuvesArchiveRouter,
    private readonly switchToTeRouter: SwitchToTeRouter
  ) {}

  private readonly actionsMutationsRouter = this.trpc.mergeRouters(
    this.addPreuveRouter.router,
    this.updateActionStatutRouter.router,
    this.updateActionCommentaireRouter.router,
    this.updateActionFichesRouter.router,
    this.listActionStatutRouter.router
  );

  private readonly actionsSupportRouter = this.trpc.mergeRouters(
    this.countPreuvesRouter.router,
    this.assignPilotesRouter.router,
    this.assignServicesRouter.router,
    this.scoreIndicatifRouter.router,
    this.actionPersonnalisationsRouter.router
  );

  private readonly referentielsSectionsRouter = this.trpc.router({
    actions: this.trpc.mergeRouters(
      this.actionsMutationsRouter,
      this.actionsSupportRouter
    ),

    snapshots: this.scoreSnapshotsRouter.router,

    labellisations: this.trpc.mergeRouters(
      this.startAudit.router,
      this.requestLabellisation.router,
      this.createPreuve.router,
      this.validateAudit.router,
      this.getLabellisation.router,
      this.handleMesureAuditStatutRouter.router,
      this.listPreuves.router,
      this.updateAuditReport.router
    ),

    documents: this.listDocumentsRouter.router,

    definitions: this.getReferentielDefinitionRouter.router,

    preferences: this.resetDisplayPreferencesRouter.router,

    historique: this.historiqueRouter.router,

    preuvesArchive: this.trpc.mergeRouters(
      this.requestPreuvesArchiveRouter.router,
      this.getPreuvesArchiveRouter.router,
      this.listPreuvesArchiveRouter.router
    ),
  });

  router = this.trpc.mergeRouters(
    this.referentielsSectionsRouter,
    this.switchToTeRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
