import { collectiviteIdInputSchemaCoerce } from '@tet/backend/collectivites/collectivite-id.input';
import MetricsService from '@tet/backend/metrics/metrics.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly metricsService: MetricsService
  ) {}

  router = this.trpc.router({
    collectivite: this.trpc.authedProcedure
      .input(collectiviteIdInputSchemaCoerce)
      .query(async ({ input, ctx }) => {
        return this.metricsService.getCollectiviteMetrics(
          input.collectiviteId,
          ctx.user
        );
      }),

    personal: this.trpc.authedProcedure
      .input(collectiviteIdInputSchemaCoerce)
      .query(async ({ input, ctx }) => {
        return this.metricsService.getPersonalMetrics(
          input.collectiviteId,
          ctx.user
        );
      }),
  });
}
