import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listAvisRecusErrorConfig } from './list-avis-recus.errors';
import { listAvisRecusInputSchema } from './list-avis-recus.input';
import { ListAvisRecusService } from './list-avis-recus.service';

@Injectable()
export class ListAvisRecusRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listAvisRecusService: ListAvisRecusService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listAvisRecusErrorConfig
  );

  router = this.trpc.router({
    listAvisRecus: this.trpc.authedProcedure
      .input(listAvisRecusInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listAvisRecusService.listAvisRecus(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
