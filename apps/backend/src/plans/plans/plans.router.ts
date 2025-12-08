import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { DeletePlanRouter } from './delete-plan/delete-plan.router';
import { GetPlanRouter } from './get-plan/get-plan.router';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { MutatePlanRouter } from './mutate-plan/mutate-plan.router';
import { CompletionAnalyticsRouter } from './completion-analytics/completion-analytics.router';

@Injectable()
export class PlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly completionAnalyticsRouter: CompletionAnalyticsRouter,
    private readonly mutatePlanRouter: MutatePlanRouter,
    private readonly getPlanRouter: GetPlanRouter,
    private readonly listPlansRouter: ListPlansRouter,
    private readonly deletePlanRouter: DeletePlanRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.completionAnalyticsRouter.router,
    this.mutatePlanRouter.router,
    this.getPlanRouter.router,
    this.listPlansRouter.router,
    this.deletePlanRouter.router
  );
}
