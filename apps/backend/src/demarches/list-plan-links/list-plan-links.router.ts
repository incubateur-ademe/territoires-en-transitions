import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPlanLinksErrorConfig } from './list-plan-links.errors';
import { listPlanLinksInputSchema } from './list-plan-links.input';
import { ListPlanLinksService } from './list-plan-links.service';

@Injectable()
export class ListPlanLinksRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPlanLinksService: ListPlanLinksService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listPlanLinksErrorConfig
  );

  router = this.trpc.router({
    listPlanLinks: this.trpc.authedProcedure
      .input(listPlanLinksInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listPlanLinksService.listPlanLinks(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
