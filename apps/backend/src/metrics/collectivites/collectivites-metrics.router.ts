import { Injectable } from '@nestjs/common';
import { collectiviteIdInputSchemaCoerce } from '@tet/backend/collectivites/collectivite-id.input';
import { getModuleRequestSchema } from '@tet/backend/metrics/collectivites/get-module.request';
import { CollectivitesModulesService } from '@tet/backend/metrics/collectivites/collectivites-modules.service';
import { CollectivitesMetricsService } from '@tet/backend/metrics/collectivites/collectivites-metrics.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { collectiviteModuleSchemaCreate } from '@tet/domain/metrics';
import z from 'zod';

@Injectable()
export class CollectivitesMetricsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly collectivitesMetricsService: CollectivitesMetricsService,
    private readonly collectivitesModulesService: CollectivitesModulesService
  ) {}

  router = this.trpc.router({
    getMetrics: this.trpc.authedProcedure
      .input(collectiviteIdInputSchemaCoerce)
      .query(async ({ input, ctx }) => {
        return this.collectivitesMetricsService.getMetrics(
          input.collectiviteId,
          ctx.user
        );
      }),

    listModules: this.trpc.authedProcedure
      .input(collectiviteIdInputSchemaCoerce)
      .query(async ({ input, ctx }) => {
        return this.collectivitesModulesService.list(
          input.collectiviteId,
          ctx.user
        );
      }),

    getModule: this.trpc.authedProcedure
      .input(getModuleRequestSchema)
      .query(async ({ input, ctx }) => {
        return this.collectivitesModulesService.get(input, ctx.user);
      }),

    upsertModule: this.trpc.authedProcedure
      .input(collectiviteModuleSchemaCreate)
      .mutation(async ({ input, ctx }) => {
        return this.collectivitesModulesService.upsert(input, ctx.user);
      }),

    deleteModule: this.trpc.authedProcedure
      .input(z.object({ collectiviteId: z.number(), moduleId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return this.collectivitesModulesService.delete(
          input.collectiviteId,
          input.moduleId,
          ctx.user
        );
      }),
  });
}
