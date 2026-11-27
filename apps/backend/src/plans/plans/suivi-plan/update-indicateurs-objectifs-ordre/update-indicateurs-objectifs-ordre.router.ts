import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getPlanErrorConfig } from '../../get-plan/get-plan.errors';
import { updateIndicateursObjectifsOrdreInputSchema } from './update-indicateurs-objectifs-ordre.input';
import { UpdateIndicateursObjectifsOrdreService } from './update-indicateurs-objectifs-ordre.service';

@Injectable()
export class UpdateIndicateursObjectifsOrdreRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateIndicateursObjectifsOrdreService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(getPlanErrorConfig);

  router = this.trpc.router({
    updateIndicateursObjectifsOrdre: this.trpc.authedProcedure
      .input(updateIndicateursObjectifsOrdreInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.updateIndicateursObjectifsOrdre(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
