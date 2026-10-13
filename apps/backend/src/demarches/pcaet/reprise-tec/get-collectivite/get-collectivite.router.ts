import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getCollectiviteErrorConfig } from './get-collectivite.errors';
import { getCollectiviteInputSchema } from './get-collectivite.input';
import { GetCollectiviteService } from './get-collectivite.service';

@Injectable()
export class GetCollectiviteRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getCollectiviteService: GetCollectiviteService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getCollectiviteErrorConfig
  );

  router = this.trpc.router({
    getCollectivite: this.trpc.authedProcedure
      .input(getCollectiviteInputSchema)
      .query(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.getCollectiviteService.getCollectivite(input, {
            user: ctx.user,
          })
        )
      ),
  });
}
