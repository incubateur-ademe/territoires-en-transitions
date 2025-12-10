import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPlansErrorConfig } from './list-plans.errors';
import { listPlansInputSchema } from './list-plans.input';
import { ListPlansService } from './list-plans.service';

@Injectable()
export class ListPlansRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPlansService: ListPlansService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(listPlansErrorConfig);

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listPlansInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listPlansService.listPlans(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
