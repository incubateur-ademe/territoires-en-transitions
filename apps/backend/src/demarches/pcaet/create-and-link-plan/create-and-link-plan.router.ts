import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { createAndLinkPlanErrorConfig } from './create-and-link-plan.errors';
import { createAndLinkPlanInputSchema } from './create-and-link-plan.input';
import { CreateAndLinkPlanService } from './create-and-link-plan.service';

@Injectable()
export class CreateAndLinkPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly createAndLinkPlanService: CreateAndLinkPlanService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    createAndLinkPlanErrorConfig
  );

  router = this.trpc.router({
    createAndLinkPlan: this.trpc.authedProcedure
      .input(createAndLinkPlanInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.createAndLinkPlanService.createAndLinkPlan(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
