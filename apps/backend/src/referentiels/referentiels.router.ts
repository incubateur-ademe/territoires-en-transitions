import { Injectable } from '@nestjs/common';
import { ScoreIndicatifRouter } from '@tet/backend/referentiels/score-indicatif/score-indicatif.router';
import { TrpcService } from '../utils/trpc/trpc.service';
import { GetReferentielDefinitionRouter } from './definitions/get-referentiel-definition/get-referentiel-definition.router';
import { HandleMesurePilotesRouter } from './handle-mesure-pilotes/handle-mesure-pilotes.router';
import { HandleMesuresServicesRouter } from './handle-mesure-services/handle-mesure-services.router';
import { CreatePreuveRouter } from './labellisations/create-preuve/create-preuve.router';
import { GetLabellisationRouter } from './labellisations/get-labellisation.router';
import { HandleMesureAuditStatutRouter } from './labellisations/handle-mesure-audit-statut/handle-mesure-audit-statut.router';
import { ListPreuvesRouter } from './labellisations/list-preuves/list-preuves.router';
import { RequestLabellisationRouter } from './labellisations/request-labellisation/request-labellisation.router';
import { StartAuditRouter } from './labellisations/start-audit/start-audit.router';
import { ValidateAuditRouter } from './labellisations/validate-audit/validate-audit.router';
import { ListActionsRouter } from './list-actions/list-actions.router';
import { SnapshotsRouter } from './snapshots/snapshots.router';
import { UpdateActionCommentaireRouter } from './update-action-commentaire/update-action-commentaire.router';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
@Injectable()
export class ReferentielsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateActionStatutRouter: UpdateActionStatutRouter,
    private readonly updateActionCommentaireRouter: UpdateActionCommentaireRouter,
    private readonly listActionStatutRouter: ListActionsRouter,
    private readonly scoreSnapshotsRouter: SnapshotsRouter,
    private readonly getLabellisation: GetLabellisationRouter,
    private readonly startAudit: StartAuditRouter,
    private readonly requestLabellisation: RequestLabellisationRouter,
    private readonly createPreuve: CreatePreuveRouter,
    private readonly validateAudit: ValidateAuditRouter,
    private readonly listPreuves: ListPreuvesRouter,
    private readonly assignPilotesRouter: HandleMesurePilotesRouter,
    private readonly assignServicesRouter: HandleMesuresServicesRouter,
    private readonly scoreIndicatifRouter: ScoreIndicatifRouter,
    private readonly handleMesureAuditStatutRouter: HandleMesureAuditStatutRouter,
    private readonly getReferentielDefinitionRouter: GetReferentielDefinitionRouter
  ) {}

  router = this.trpc.router({
    actions: this.trpc.mergeRouters(
      this.updateActionStatutRouter.router,
      this.updateActionCommentaireRouter.router,
      this.listActionStatutRouter.router,
      this.assignPilotesRouter.router,
      this.assignServicesRouter.router,
      this.scoreIndicatifRouter.router
    ),

    snapshots: this.scoreSnapshotsRouter.router,

    labellisations: this.trpc.mergeRouters(
      this.startAudit.router,
      this.requestLabellisation.router,
      this.createPreuve.router,
      this.validateAudit.router,
      this.getLabellisation.router,
      this.handleMesureAuditStatutRouter.router,
      this.listPreuves.router
    ),

    definitions: this.getReferentielDefinitionRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
