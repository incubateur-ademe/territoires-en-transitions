import { Injectable } from '@nestjs/common';
import { TrpcService } from '../utils/trpc/trpc.service';
import { AssignPilotesRouter } from './assign-pilotes/assign-pilotes.router';
import { AssignServicesRouter } from './assign-services/assign-services.router';
import { GetLabellisationRouter } from './labellisations/get-labellisation.router';
import { StartAuditRouter } from './labellisations/start-audit/start-audit.router';
import { ValidateAuditRouter } from './labellisations/validate-audit/validate-audit.router';
import { ListActionsRouter } from './list-actions/list-actions.router';
import { SnapshotsRouter } from './snapshots/snapshots.router';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
@Injectable()
export class ReferentielsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateActionStatutRouter: UpdateActionStatutRouter,
    private readonly listActionStatutRouter: ListActionsRouter,
    private readonly scoreSnapshotsRouter: SnapshotsRouter,
    private readonly getLabellisation: GetLabellisationRouter,
    private readonly startAudit: StartAuditRouter,
    private readonly validateAudit: ValidateAuditRouter,
    private readonly computeScoreRouter: ComputeScoreRouter,
    private readonly assignPilotesRouter: AssignPilotesRouter,
    private readonly assignServicesRouter: AssignServicesRouter
  ) {}

  router = this.trpc.router({
    actions: this.trpc.mergeRouters(
      this.updateActionStatutRouter.router,
      this.listActionStatutRouter.router,
      this.assignPilotesRouter.router,
      this.assignServicesRouter.router
    ),

    snapshots: this.scoreSnapshotsRouter.router,

    labellisations: this.trpc.mergeRouters(
      this.startAudit.router,
      this.validateAudit.router,
      this.getLabellisation.router
    ),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
