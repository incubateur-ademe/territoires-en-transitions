import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getPlanErrorConfig } from '../../get-plan/get-plan.errors';
import { getEvolutionStatutsInputSchema } from './get-evolution-statuts.input';
import { GetEvolutionStatutsService } from './get-evolution-statuts.service';

@Injectable()
export class GetEvolutionStatutsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: GetEvolutionStatutsService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(getPlanErrorConfig);

  router = this.trpc.router({
    getEvolutionStatuts: this.trpc.authedProcedure
      .input(getEvolutionStatutsInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.service.getEvolutionStatuts(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
