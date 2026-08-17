import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { demarchePcaetTransitionInputSchema } from '../shared/demarche-pcaet-transition.input';
import { reprendreDemarchePcaetErrorConfig } from './reprendre-elaboration.errors';
import { ReprendreElaborationDemarchePcaetService } from './reprendre-elaboration.service';

@Injectable()
export class ReprendreElaborationDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly reprendreService: ReprendreElaborationDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    reprendreDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    reprendreElaboration: this.trpc.authedProcedure
      .input(demarchePcaetTransitionInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.reprendreService.reprendre(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
