import { Injectable } from '@nestjs/common';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import CollectiviteUpsertService from '@/backend/collectivites/collectivite-upsert/collectivite-upsert.service';
import { collectiviteUpsertSchema } from '@/backend/collectivites/shared/models/collectivite.table';
import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';

@Injectable()
export class CollectiviteUpsertRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CollectiviteUpsertService,
    private readonly permission: PermissionService
  ) {}

  router = this.trpc.router({
    upsert: this.trpc.authedProcedure
      .input(collectiviteUpsertSchema)
      .mutation(async ({ ctx, input }) => {
        await this.permission.isAllowed(
          ctx.user,
          PermissionOperation.COLLECTIVITES_EDITION,
          ResourceType.PLATEFORME,
          null
        );
        return this.service.upsert(input);
      }),
    complete: this.trpc.authedProcedure
      .input(collectiviteUpsertSchema)
      .query(async ({ ctx, input }) => {
        await this.permission.isAllowed(
          ctx.user,
          PermissionOperation.COLLECTIVITES_LECTURE,
          ResourceType.PLATEFORME,
          null
        );
        return this.service.getAdditionalInformation(input);
      }),
    find: this.trpc.authedProcedure
      .input(collectiviteUpsertSchema)
      .query(async ({ ctx, input }) => {
        await this.permission.isAllowed(
          ctx.user,
          PermissionOperation.COLLECTIVITES_LECTURE,
          ResourceType.PLATEFORME,
          null
        );
        return this.service.find(input);
      }),
  });
}
