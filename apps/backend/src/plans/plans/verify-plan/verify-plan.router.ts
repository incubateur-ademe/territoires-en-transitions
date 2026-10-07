import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { verifyPlanErrorConfig } from './verify-plan.errors';
import { verifyPlanInputSchema } from './verify-plan.input';
import { VerifyPlanService } from './verify-plan.service';

@Injectable()
export class VerifyPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly verifyPlanService: VerifyPlanService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    verifyPlanErrorConfig
  );

  router = this.trpc.router({
    verify: this.trpc.authedProcedure
      .input(verifyPlanInputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.verifyPlanService.verifyPlan(input, { user });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
