import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getPlanErrorConfig } from '../../get-plan/get-plan.errors';
import { suiviPlanBlocInputSchema } from '../suivi-plan.input';
import { GetFaireAvancerLePlanService } from './get-faire-avancer-le-plan.service';

@Injectable()
export class GetFaireAvancerLePlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: GetFaireAvancerLePlanService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(getPlanErrorConfig);

  router = this.trpc.router({
    getFaireAvancerLePlan: this.trpc.authedProcedure
      .input(suiviPlanBlocInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.service.getFaireAvancerLePlan(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
