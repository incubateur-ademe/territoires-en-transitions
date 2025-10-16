import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
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
    get: this.trpc.authedProcedure
      .input(completionAnalyticsInputSchema)
      .query(({ input }) => {
        return this.service.get(input.planId);
      }),
  });
}
