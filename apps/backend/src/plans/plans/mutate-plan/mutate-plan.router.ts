import { createTrpcErrorHandler } from '@/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { mutatePlanErrorConfig } from './mutate-plan.errors';
import { mutatePlanSchema } from './mutate-plan.input';
import { MutatePlanService } from './mutate-plan.service';

@Injectable()
export class MutatePlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly mutatePlanService: MutatePlanService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    mutatePlanErrorConfig
  );

  router = this.trpc.router({
    upsert: this.trpc.authedProcedure
      .input(mutatePlanSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.mutatePlanService.mutatePlan(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
