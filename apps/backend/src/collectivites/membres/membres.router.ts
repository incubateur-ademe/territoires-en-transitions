import { ExportConnectService } from '@/backend/collectivites/membres/export-connect.service';
import { upsertExportConnectSchema } from '@/backend/collectivites/membres/export-connect.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { CollectiviteMembresService } from './membres.service';

@Injectable()
export class CollectiviteMembresRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CollectiviteMembresService,
    private readonly permissionService: PermissionService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(this.service.listInputSchema)
      .query(({ input }) => this.service.list(input)),

    update: this.trpc.authedProcedure
      .input(this.service.updateInputSchema)
      .mutation(async ({ input, ctx }) => {
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperationEnum['COLLECTIVITES.MEMBRES.EDITION'],
          ResourceType.COLLECTIVITE,
          input[0].collectiviteId
        );
        return this.service.update(input, ctx.user.id);
      }),

    remove: this.trpc.authedProcedure
      .input(this.service.removeInputSchema)
      .mutation(async ({ input, ctx }) => {
        return this.service.remove({
          ...input,
          currentUserId: ctx.user.id,
        });
      }),

    listExportConnect: this.trpc.authedOrServiceRoleProcedure.query(({ ctx }) =>
      this.exportConnectService.list(ctx.user)
    ),

    upsertExportConnect: this.trpc.authedOrServiceRoleProcedure
      .input(upsertExportConnectSchema)
      .mutation(({ input, ctx }) =>
        this.exportConnectService.upsert(input, ctx.user)
      ),
  });
}
