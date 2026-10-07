import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { upsertAvisErrorConfig } from './upsert-avis.errors';
import { upsertAvisInputSchema } from './upsert-avis.input';
import { UpsertAvisService } from './upsert-avis.service';

@Injectable()
export class UpsertAvisRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly upsertAvisService: UpsertAvisService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(upsertAvisErrorConfig);

  router = this.trpc.router({
    upsertAvis: this.trpc.authedProcedure
      .input(upsertAvisInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.upsertAvisService.upsertAvis(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
