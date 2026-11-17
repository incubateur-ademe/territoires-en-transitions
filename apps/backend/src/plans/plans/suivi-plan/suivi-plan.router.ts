import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetAvancementParAxeRouter } from './get-avancement-par-axe/get-avancement-par-axe.router';
import { GetEvolutionStatutsRouter } from './get-evolution-statuts/get-evolution-statuts.router';
import { GetFaireAvancerLePlanRouter } from './get-faire-avancer-le-plan/get-faire-avancer-le-plan.router';
import { GetIndicateursObjectifsRouter } from './get-indicateurs-objectifs/get-indicateurs-objectifs.router';
import { GetVueEnsembleRouter } from './get-vue-ensemble/get-vue-ensemble.router';
import { SuiviPlanModulesRouter } from './suivi-plan-modules/suivi-plan-modules.router';

@Injectable()
export class SuiviPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getVueEnsembleRouter: GetVueEnsembleRouter,
    private readonly getAvancementParAxeRouter: GetAvancementParAxeRouter,
    private readonly getEvolutionStatutsRouter: GetEvolutionStatutsRouter,
    private readonly getFaireAvancerLePlanRouter: GetFaireAvancerLePlanRouter,
    private readonly suiviPlanModulesRouter: SuiviPlanModulesRouter,
    private readonly getIndicateursObjectifsRouter: GetIndicateursObjectifsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.getVueEnsembleRouter.router,
    this.getAvancementParAxeRouter.router,
    this.getEvolutionStatutsRouter.router,
    this.getFaireAvancerLePlanRouter.router,
    this.suiviPlanModulesRouter.router,
    this.getIndicateursObjectifsRouter.router
  );
}
