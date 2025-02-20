import { Injectable } from '@nestjs/common';
import { TrpcService } from '../utils/trpc/trpc.service';
import { ComputeScoreRouter } from './compute-score/compute-score.router';
import { ScoreSnapshotsRouter } from './snapshots/score-snaphots.router';
import { UpdateActionStatutRouter } from './update-action-statut/update-action-statut.router';

@Injectable()
export class ReferentielsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateActionStatutRouter: UpdateActionStatutRouter,
    private readonly scoreSnapshotsRouter: ScoreSnapshotsRouter,
    private readonly computeScoreRouter: ComputeScoreRouter
  ) {}

  router = this.trpc.router({
    actions: this.trpc.mergeRouters(
      this.updateActionStatutRouter.router,
    ),
    snapshots: this.scoreSnapshotsRouter.router,
    scores: this.computeScoreRouter.router,
  });
}
