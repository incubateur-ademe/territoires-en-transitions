import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getPlanErrorConfig } from '../../get-plan/get-plan.errors';
import { suiviPlanBlocInputSchema } from '../suivi-plan.input';
import { GetAvancementParAxeService } from './get-avancement-par-axe.service';

@Injectable()
export class GetAvancementParAxeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: GetAvancementParAxeService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(getPlanErrorConfig);

  router = this.trpc.router({
    getAvancementParAxe: this.trpc.authedProcedure
      .input(suiviPlanBlocInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.service.getAvancementParAxe(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
