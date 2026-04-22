import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
import { upsertPlanErrorConfig } from './upsert-plan.errors';
import { createPlanSchema, updatePlanSchema } from './upsert-plan.input';
import { UpsertPlanService } from './upsert-plan.service';

const setFichesPrivateSchema = z.object({
  planId: z.number().int().positive(),
  isPrivate: z.boolean(),
});

@Injectable()
export class UpsertPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly upsertPlanService: UpsertPlanService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    upsertPlanErrorConfig
  );

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createPlanSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.upsertPlanService.upsertPlan(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
    update: this.trpc.authedProcedure
      .input(updatePlanSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.upsertPlanService.upsertPlan(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
    setFichesPrivate: this.trpc.authedProcedure
      .input(setFichesPrivateSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.upsertPlanService.setFichesPrivate({
          planId: input.planId,
          isPrivate: input.isPrivate,
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
