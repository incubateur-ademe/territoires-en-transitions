import { Injectable } from '@nestjs/common';
import { ExportConnectService } from '@tet/backend/collectivites/membres/sync-membres-with-crm-connect/export-connect.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { exportConnectCreateSchema } from '@tet/domain/collectivites';
import z from 'zod';
import { listMembresInputSchema } from './list-membres/list-membres.input';
import { ListMembresService } from './list-membres/list-membres.service';
import { InvitationsRouter } from './mutate-invitations/invitations.router';
import { mutateMembresErrorConfig } from './mutate-membres/mutate-membres.errors';
import {
  removeMembreInputSchema,
  updateMembreInputSchema,
} from './mutate-membres/mutate-membres.input';
import { MutateMembresService } from './mutate-membres/mutate-membres.service';

@Injectable()
export class CollectiviteMembresRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listMembresService: ListMembresService,
    private readonly mutateMembresService: MutateMembresService,
    private readonly exportConnectService: ExportConnectService,
    private readonly invitationRouter: InvitationsRouter
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    mutateMembresErrorConfig
  );

  router = this.trpc.router({
    invitations: this.invitationRouter.router,

    list: this.trpc.authedProcedure
      .input(listMembresInputSchema)
      .query(({ input, ctx }) =>
        this.listMembresService.list(input, { user: ctx.user })
      ),

    update: this.trpc.authedProcedure
      .input(z.array(updateMembreInputSchema))
      .mutation(async ({ input, ctx }) => {
        const result = await this.mutateMembresService.update(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),

    remove: this.trpc.authedProcedure
      .input(removeMembreInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.mutateMembresService.remove(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),

    listExportConnect: this.trpc.authedOrServiceRoleProcedure.query(({ ctx }) =>
      this.exportConnectService.list(ctx.user)
    ),

    upsertExportConnect: this.trpc.authedOrServiceRoleProcedure
      .input(z.array(exportConnectCreateSchema))
      .mutation(({ input, ctx }) =>
        this.exportConnectService.upsert(input, ctx.user)
      ),
  });
}
