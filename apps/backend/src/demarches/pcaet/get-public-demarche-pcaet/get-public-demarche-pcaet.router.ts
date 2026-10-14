import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getPublicDemarchePcaetErrorConfig } from './get-public-demarche-pcaet.errors';
import { getPublicDemarchePcaetInputSchema } from './get-public-demarche-pcaet.input';
import { GetPublicDemarchePcaetService } from './get-public-demarche-pcaet.service';

@Injectable()
export class GetPublicDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getPublicDemarchePcaetService: GetPublicDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getPublicDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    getPublic: this.trpc.authedProcedure
      .input(getPublicDemarchePcaetInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.getPublicDemarchePcaetService.getPublicDemarchePcaet(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
