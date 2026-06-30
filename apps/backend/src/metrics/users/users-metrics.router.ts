import { Injectable } from '@nestjs/common';
import { collectiviteIdInputSchemaCoerce } from '@tet/backend/collectivites/collectivite-id.input';
import { UsersModulesService } from '@tet/backend/metrics/users/users-modules.service';
import { UsersMetricsService } from '@tet/backend/metrics/users/users-metrics.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  moduleSchemaInsert,
  personalDefaultModuleKeysSchema,
} from '@tet/domain/metrics';
import z from 'zod';

@Injectable()
export class UsersMetricsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly usersMetricsService: UsersMetricsService,
    private readonly usersModulesService: UsersModulesService
  ) {}

  router = this.trpc.router({
    getMetrics: this.trpc.authedProcedure
      .input(collectiviteIdInputSchemaCoerce)
      .query(async ({ input, ctx }) => {
        return this.usersMetricsService.getMetrics(
          input.collectiviteId,
          ctx.user
        );
      }),

    listModules: this.trpc.authedProcedure
      .input(collectiviteIdInputSchemaCoerce)
      .query(async ({ input, ctx }) => {
        return this.usersModulesService.list(input.collectiviteId, ctx.user);
      }),

    getModule: this.trpc.authedProcedure
      .input(
        z.object({
          ...collectiviteIdInputSchemaCoerce.shape,
          defaultKey: personalDefaultModuleKeysSchema,
        })
      )
      .query(async ({ input, ctx }) => {
        return this.usersModulesService.get(
          input.collectiviteId,
          input.defaultKey,
          ctx.user
        );
      }),

    upsertModule: this.trpc.authedProcedure
      .input(moduleSchemaInsert)
      .mutation(async ({ input, ctx }) => {
        return this.usersModulesService.upsert(input, ctx.user);
      }),
  });
}
