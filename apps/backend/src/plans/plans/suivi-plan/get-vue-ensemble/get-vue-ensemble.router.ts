import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getPlanErrorConfig } from '../../get-plan/get-plan.errors';
import { suiviPlanBlocInputSchema } from '../suivi-plan.input';
import { GetVueEnsembleService } from './get-vue-ensemble.service';

@Injectable()
export class GetVueEnsembleRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: GetVueEnsembleService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(getPlanErrorConfig);

  router = this.trpc.router({
    getVueEnsemble: this.trpc.authedProcedure
      .input(suiviPlanBlocInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.service.getVueEnsemble(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
