import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { GetPlanCompletionService } from './get-plan-completion.service';

const getPlanCompletionInputSchema = z.object({
  planId: z.number(),
});

@Injectable()
export class GetPlanCompletionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: GetPlanCompletionService
  ) {}

  router = this.trpc.router({
    getPlanCompletion: this.trpc.authedProcedure
      .input(getPlanCompletionInputSchema)
      .query(({ input }) => {
        return this.service.getPlanCompletion(input.planId);
      }),
  });
}
