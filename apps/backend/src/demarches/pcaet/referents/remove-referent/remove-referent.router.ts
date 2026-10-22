import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { referentsPcaetErrorConfig } from '../referents-pcaet.errors';
import { removeReferentInputSchema } from './remove-referent.input';
import { RemoveReferentService } from './remove-referent.service';

@Injectable()
export class RemoveReferentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly removeReferentService: RemoveReferentService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    referentsPcaetErrorConfig
  );

  router = this.trpc.router({
    remove: this.trpc.authedProcedure
      .input(removeReferentInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.removeReferentService.remove(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
