import { Injectable } from '@nestjs/common';
import { collectiviteIdInputSchemaCoerce } from '@tet/backend/collectivites/collectivite-id.input';
import { getTableauDeBordModuleRequestSchema } from '@tet/backend/collectivites/tableau-de-bord/get-tableau-de-bord-module.request';
import TableauDeBordCollectiviteService from '@tet/backend/collectivites/tableau-de-bord/tableau-de-bord-collectivite.service';
import { TableauDeBordPersonnelService } from '@tet/backend/collectivites/tableau-de-bord/tableau-de-bord-personnel.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  collectiviteModuleSchemaCreate,
  moduleSchemaInsert,
  personalDefaultModuleKeysSchema,
} from '@tet/domain/collectivites/tableau-de-bord';
import z from 'zod';

@Injectable()
export class TableauDeBordCollectiviteRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly tableauDeBordCollectiviteService: TableauDeBordCollectiviteService,
    private readonly tableauDeBordPersonnelService: TableauDeBordPersonnelService
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

    /** Liste les modules du tableau de bord personnel de l'utilisateur courant */
    listPersonnel: this.trpc.authedProcedure
      .input(collectiviteIdInputSchemaCoerce)
      .query(async ({ input, ctx }) => {
        return this.tableauDeBordPersonnelService.list(
          input.collectiviteId,
          ctx.user
        );
      }),

    /** Récupère un module du tableau de bord personnel de l'utilisateur courant */
    getPersonnel: this.trpc.authedProcedure
      .input(
        z.object({
          ...collectiviteIdInputSchemaCoerce.shape,
          defaultKey: personalDefaultModuleKeysSchema,
        })
      )
      .query(async ({ input, ctx }) => {
        return this.tableauDeBordPersonnelService.get(
          input.collectiviteId,
          input.defaultKey,
          ctx.user
        );
      }),

    /** Crée ou met à jour un module du tableau de bord personnel */
    upsertPersonnel: this.trpc.authedProcedure
      .input(moduleSchemaInsert)
      .mutation(async ({ input, ctx }) => {
        return this.tableauDeBordPersonnelService.upsert(input, ctx.user);
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
