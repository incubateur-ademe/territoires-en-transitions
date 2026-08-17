import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { demarchePcaetTransitionInputSchema } from '../shared/demarche-pcaet-transition.input';
import { publierDemarchePcaetErrorConfig } from './publier-demarche.errors';
import { PublierDemarchePcaetService } from './publier-demarche.service';

@Injectable()
export class PublierDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly publierService: PublierDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    publierDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    publier: this.trpc.authedProcedure
      .input(demarchePcaetTransitionInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.publierService.publier(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
