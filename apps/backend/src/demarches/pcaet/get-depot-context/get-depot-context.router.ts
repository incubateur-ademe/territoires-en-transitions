import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getDepotContextErrorConfig } from './get-depot-context.errors';
import { getDepotContextInputSchema } from './get-depot-context.input';
import { GetDepotContextService } from './get-depot-context.service';

@Injectable()
export class GetDepotContextRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDepotContextService: GetDepotContextService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getDepotContextErrorConfig
  );

  router = this.trpc.router({
    getDepotContext: this.trpc.authedProcedure
      .input(getDepotContextInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.getDepotContextService.getDepotContext(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
