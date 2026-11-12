import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetAvancementParAxeRouter } from './get-avancement-par-axe/get-avancement-par-axe.router';
import { GetEvolutionStatutsRouter } from './get-evolution-statuts/get-evolution-statuts.router';
import { GetVueEnsembleRouter } from './get-vue-ensemble/get-vue-ensemble.router';

@Injectable()
export class SuiviPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getVueEnsembleRouter: GetVueEnsembleRouter,
    private readonly getAvancementParAxeRouter: GetAvancementParAxeRouter,
    private readonly getEvolutionStatutsRouter: GetEvolutionStatutsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.getVueEnsembleRouter.router,
    this.getAvancementParAxeRouter.router,
    this.getEvolutionStatutsRouter.router
  );
}
