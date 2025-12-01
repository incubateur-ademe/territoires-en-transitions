import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  createAxeRequestSchema,
  createPlanSchema,
  deleteAxeSchema,
  deletePlanSchema,
  getPlanSchema,
  listPlansRequestSchema,
  updateAxeRequestSchema,
  updatePlanSchema,
} from '@tet/domain/plans';
import { MutatePlanRouter } from './mutate-plan/mutate-plan.router';
import { planErrorConfig } from './plans.errors';
import { PlanService } from './plans.service';

@Injectable()
export class PlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly planService: PlanService,
    private readonly mutatePlanRouter: MutatePlanRouter
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(planErrorConfig);

  router = this.trpc.mergeRouters(
    this.trpc.router({
      create: this.trpc.authedProcedure
        .input(createPlanSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.planService.createPlan(input, ctx.user);
          return this.getResultDataOrThrowError(result);
        }),

      update: this.trpc.authedProcedure
        .input(updatePlanSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.planService.updatePlan(input, ctx.user);

          return this.getResultDataOrThrowError(result);
        }),

      get: this.trpc.authedProcedure
        .input(getPlanSchema)
        .query(async ({ input, ctx }) => {
          const result = await this.planService.findById(
            input.planId,
            ctx.user
          );
          return this.getResultDataOrThrowError(result);
        }),

      list: this.trpc.authedProcedure
        .input(listPlansRequestSchema)
        .query(async ({ input, ctx }) => {
          const result = await this.planService.listPlans(
            input.collectiviteId,
            ctx.user,
            {
              limit: input.limit,
              page: input.page,
              sort: input.sort,
            }
          );
          return this.getResultDataOrThrowError(result);
        }),

      createAxe: this.trpc.authedProcedure
        .input(createAxeRequestSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.planService.upsertAxe(input, ctx.user);
          return this.getResultDataOrThrowError(result);
        }),

      updateAxe: this.trpc.authedProcedure
        .input(updateAxeRequestSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.planService.upsertAxe(input, ctx.user);
          return this.getResultDataOrThrowError(result);
        }),

      deleteAxe: this.trpc.authedProcedure
        .input(deleteAxeSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.planService.deleteAxe(
            input.axeId,
            ctx.user
          );
          return this.getResultDataOrThrowError(result);
        }),

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
    this.mutatePlanRouter.router
  );
}
