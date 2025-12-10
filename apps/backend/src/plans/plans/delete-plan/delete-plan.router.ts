import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { deletePlanErrorConfig } from './delete-plan.errors';
import { deletePlanInputSchema } from './delete-plan.input';
import { DeletePlanService } from './delete-plan.service';

@Injectable()
export class DeletePlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly deletePlanService: DeletePlanService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    deletePlanErrorConfig
  );

  router = this.trpc.router({
    delete: this.trpc.authedProcedure
      .input(deletePlanInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.deletePlanService.deletePlan(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
