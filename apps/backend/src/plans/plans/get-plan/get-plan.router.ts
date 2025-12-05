import { createTrpcErrorHandler } from '@/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { getPlanErrorConfig } from './get-plan.errors';
import { getPlanInputSchema } from './get-plan.input';
import { GetPlanService } from './get-plan.service';

@Injectable()
export class GetPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getPlanService: GetPlanService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(getPlanErrorConfig);

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(getPlanInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.getPlanService.getPlan(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}

