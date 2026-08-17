import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { demarchePcaetTransitionInputSchema } from '../shared/demarche-pcaet-transition.input';
import { transmettreDemarchePcaetErrorConfig } from './transmettre-pour-avis.errors';
import { TransmettrePourAvisDemarchePcaetService } from './transmettre-pour-avis.service';

@Injectable()
export class TransmettrePourAvisDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly transmettreService: TransmettrePourAvisDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    transmettreDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    transmettrePourAvis: this.trpc.authedProcedure
      .input(demarchePcaetTransitionInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.transmettreService.transmettre(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
