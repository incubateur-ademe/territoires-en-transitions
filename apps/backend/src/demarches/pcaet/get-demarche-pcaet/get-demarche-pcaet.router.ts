import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getDemarchePcaetErrorConfig } from './get-demarche-pcaet.errors';
import { getDemarchePcaetInputSchema } from './get-demarche-pcaet.input';
import { GetDemarchePcaetService } from './get-demarche-pcaet.service';

@Injectable()
export class GetDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDemarchePcaetService: GetDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(getDemarchePcaetInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.getDemarchePcaetService.getDemarchePcaet(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
