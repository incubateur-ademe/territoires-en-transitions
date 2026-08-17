import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { demarchePcaetTransitionInputSchema } from '../shared/demarche-pcaet-transition.input';
import { archiverDemarchePcaetErrorConfig } from './archiver-demarche.errors';
import { ArchiverDemarchePcaetService } from './archiver-demarche.service';

@Injectable()
export class ArchiverDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly archiverService: ArchiverDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    archiverDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    archiver: this.trpc.authedProcedure
      .input(demarchePcaetTransitionInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.archiverService.archiver(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
