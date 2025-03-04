import { Injectable } from '@nestjs/common';
import { TrpcService } from '../utils/trpc/trpc.service';
import { ComputeScoreRouter } from './compute-score/compute-score.router';
import { ListActionsRouter } from './list-actions/list-actions.router';
import { SnapshotsRouter } from './snapshots/snaphots.router';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';
import { GetLabellisationRouter } from './labellisations/get-labellisation.router';

@Injectable()
export class ReferentielsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateActionStatutRouter: UpdateActionStatutRouter,
    private readonly listActionStatutRouter: ListActionsRouter,
    private readonly scoreSnapshotsRouter: SnapshotsRouter,
    private readonly computeScoreRouter: ComputeScoreRouter,
    private readonly getLabellisation: GetLabellisationRouter
  ) {}

  router = this.trpc.router({
    actions: this.trpc.mergeRouters(
      this.updateActionStatutRouter.router,
      this.listActionStatutRouter.router
    ),
    snapshots: this.scoreSnapshotsRouter.router,
    scores: this.computeScoreRouter.router,
    labellisations: this.getLabellisation.router,
  });
}
