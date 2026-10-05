import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPlanSecteursCountsInputSchema } from './list-plan-secteurs-counts.input';
import { listPlanSecteursCountsOutputSchema } from './list-plan-secteurs-counts.output';
import { ListPlanSecteursCountsService } from './list-plan-secteurs-counts.service';

@Injectable()
export class ListPlanSecteursCountsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListPlanSecteursCountsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    listPlanSecteursCounts: this.trpc.authedProcedure
      .input(listPlanSecteursCountsInputSchema)
      .output(listPlanSecteursCountsOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.service.listCounts(input, { user });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
