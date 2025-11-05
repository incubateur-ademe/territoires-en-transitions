import { collectiviteIdInputSchemaCoerce } from '@/backend/collectivites/collectivite-id.input';
import { getTableauDeBordModuleRequestSchema } from '@/backend/collectivites/tableau-de-bord/get-tableau-de-bord-module.request';
import TableauDeBordCollectiviteService from '@/backend/collectivites/tableau-de-bord/tableau-de-bord-collectivite.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { collectiviteModuleSchemaCreate } from '@/domain/collectivites/tableau-de-bord';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class TableauDeBordCollectiviteRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly tableauDeBordCollectiviteService: TableauDeBordCollectiviteService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(collectiviteIdInputSchemaCoerce)
      .query(async ({ input, ctx }) => {
        return this.tableauDeBordCollectiviteService.list(
          input.collectiviteId,
          ctx.user
        );
      }),
    get: this.trpc.authedProcedure
      .input(getTableauDeBordModuleRequestSchema)
      .query(async ({ input, ctx }) => {
        return this.tableauDeBordCollectiviteService.get(input, ctx.user);
      }),

    upsert: this.trpc.authedProcedure
      .input(collectiviteModuleSchemaCreate)
      .mutation(async ({ input, ctx }) => {
        return this.tableauDeBordCollectiviteService.upsert(input, ctx.user);
      }),

    delete: this.trpc.authedProcedure
      .input(z.object({ collectiviteId: z.number(), moduleId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return this.tableauDeBordCollectiviteService.delete(
          input.collectiviteId,
          input.moduleId,
          ctx.user
        );
      }),
  });
}
