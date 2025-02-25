import { Injectable } from '@nestjs/common';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import CollectiviteCrudService from '@/backend/collectivites/collectivite-crud/collectivite-crud.service';
import { collectiviteUpsertSchema } from '@/backend/collectivites/shared/models/collectivite.table';
import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { z } from 'zod';

@Injectable()
export class CollectiviteCrudRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CollectiviteCrudService,
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
    getAdditionalInformation: this.trpc.authedProcedure
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
    select: this.trpc.authedProcedure
      .input(z.object({ collectiviteId: z.number() }))
      .query(async ({ ctx, input }) => {
        await this.permission.isAllowed(
          ctx.user,
          PermissionOperation.COLLECTIVITES_LECTURE,
          ResourceType.PLATEFORME,
          null
        );
        return this.service.select(input.collectiviteId);
      }),
  });
}
