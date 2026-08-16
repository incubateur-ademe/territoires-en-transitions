import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { envoyerAvisErrorConfig } from './envoyer-avis.errors';
import { envoyerAvisInputSchema } from './envoyer-avis.input';
import { EnvoyerAvisService } from './envoyer-avis.service';

@Injectable()
export class EnvoyerAvisRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly envoyerAvisService: EnvoyerAvisService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    envoyerAvisErrorConfig
  );

  router = this.trpc.router({
    envoyerAvis: this.trpc.authedProcedure
      .input(envoyerAvisInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.envoyerAvisService.envoyerAvis(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
