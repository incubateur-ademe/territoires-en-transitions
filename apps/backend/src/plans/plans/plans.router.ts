import { createTrpcErrorHandler } from '@/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { GetPlanRouter } from './get-plan/get-plan.router';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { MutatePlanRouter } from './mutate-plan/mutate-plan.router';
import { planErrorConfig } from './plans.errors';
import { deletePlanSchema } from './plans.schema';
import { PlanService } from './plans.service';

@Injectable()
export class PlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly planService: PlanService,
    private readonly mutatePlanRouter: MutatePlanRouter,
    private readonly getPlanRouter: GetPlanRouter,
    private readonly listPlansRouter: ListPlansRouter
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(planErrorConfig);

  router = this.trpc.mergeRouters(
    this.trpc.router({
      deletePlan: this.trpc.authedProcedure
        .input(deletePlanSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.planService.deletePlan(
            input.planId,
            ctx.user
          );
          return this.getResultDataOrThrowError(result);
        }),
    }),
    this.mutatePlanRouter.router,
    this.getPlanRouter.router,
    this.listPlansRouter.router
  );
}
