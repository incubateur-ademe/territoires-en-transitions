import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { CompletionAnalyticsService } from './completion-analytics.service';

const completionAnalyticsInputSchema = z.object({
  planId: z.number(),
});

@Injectable()
export class CompletionAnalyticsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CompletionAnalyticsService
  ) {}

  router = this.trpc.router({
    getFieldsToComplete: this.trpc.authedProcedure
      .input(completionAnalyticsInputSchema)
      .query(({ input }) => {
        return this.service.getFieldsToComplete(input.planId);
      }),
  });
}
