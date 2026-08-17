import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { demarchePcaetTransitionInputSchema } from '../shared/demarche-pcaet-transition.input';
import { depublierDemarchePcaetErrorConfig } from './depublier-demarche.errors';
import { DepublierDemarchePcaetService } from './depublier-demarche.service';

@Injectable()
export class DepublierDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly depublierService: DepublierDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    depublierDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    depublier: this.trpc.authedProcedure
      .input(demarchePcaetTransitionInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.depublierService.depublier(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
