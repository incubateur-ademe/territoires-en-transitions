import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getPlanErrorConfig } from '../../get-plan/get-plan.errors';
import { getIndicateursObjectifsInputSchema } from './get-indicateurs-objectifs.input';
import { GetIndicateursObjectifsService } from './get-indicateurs-objectifs.service';

@Injectable()
export class GetIndicateursObjectifsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: GetIndicateursObjectifsService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(getPlanErrorConfig);

  router = this.trpc.router({
    getIndicateursObjectifs: this.trpc.authedProcedure
      .input(getIndicateursObjectifsInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.service.getIndicateursObjectifs(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
