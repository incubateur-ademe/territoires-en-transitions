import { Injectable } from '@nestjs/common';
import CollectiviteCrudService from '@tet/backend/collectivites/collectivite-crud/collectivite-crud.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  collectiviteUpdateNICSchema,
  collectiviteUpsertSchema,
} from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
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
          PermissionOperationEnum['COLLECTIVITES.MUTATE'],
          ResourceType.PLATEFORME,
          null
        );
        return this.service.upsert(input);
      }),
    updateNIC: this.trpc.authedOrServiceRoleProcedure
      .input(collectiviteUpdateNICSchema)
      .mutation(async ({ ctx, input }) => {
        await this.permission.isAllowed(
          ctx.user,
          PermissionOperationEnum['COLLECTIVITES.MUTATE'],
          ResourceType.PLATEFORME,
          null
        );
        return this.service.updateNIC(input);
      }),
    getAdditionalInformation: this.trpc.authedProcedure
      .input(collectiviteUpsertSchema)
      .query(async ({ ctx, input }) => {
        await this.permission.isAllowed(
          ctx.user,
          'collectivites.read_confidentiel',
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
          'collectivites.read_confidentiel',
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
          'collectivites.read_confidentiel',
          ResourceType.PLATEFORME,
          null
        );
        return this.service.select(input.collectiviteId);
      }),
  });
}
