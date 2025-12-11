import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { CompletionAnalyticsRouter } from './completion-analytics/completion-analytics.router';
import { DeletePlanRouter } from './delete-plan/delete-plan.router';
import { GetPlanRouter } from './get-plan/get-plan.router';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { UpsertPlanRouter } from './upsert-plan/upsert-plan.router';

@Injectable()
export class PlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly completionAnalyticsRouter: CompletionAnalyticsRouter,
    private readonly upsertPlanRouter: UpsertPlanRouter,
    private readonly getPlanRouter: GetPlanRouter,
    private readonly listPlansRouter: ListPlansRouter,
    private readonly deletePlanRouter: DeletePlanRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.completionAnalyticsRouter.router,
    this.upsertPlanRouter.router,
    this.getPlanRouter.router,
    this.listPlansRouter.router,
    this.deletePlanRouter.router
  );
}
