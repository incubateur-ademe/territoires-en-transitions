import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { validerAvisErrorConfig } from './valider-avis.errors';
import { validerAvisInputSchema } from './valider-avis.input';
import { ValiderAvisService } from './valider-avis.service';

@Injectable()
export class ValiderAvisRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly validerAvisService: ValiderAvisService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    validerAvisErrorConfig
  );

  router = this.trpc.router({
    validerAvis: this.trpc.authedProcedure
      .input(validerAvisInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.validerAvisService.validerAvis(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
