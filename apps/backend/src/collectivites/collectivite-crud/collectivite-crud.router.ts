import CollectiviteCrudService from '@/backend/collectivites/collectivite-crud/collectivite-crud.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import {
  collectiviteUpdateNICSchema,
  collectiviteUpsertSchema,
} from '@/domain/collectivites';
import { PermissionOperationEnum } from '@/domain/users';
import { Injectable } from '@nestjs/common';
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
          PermissionOperationEnum['COLLECTIVITES.READ'],
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
          PermissionOperationEnum['COLLECTIVITES.READ'],
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
          PermissionOperationEnum['COLLECTIVITES.READ'],
          ResourceType.PLATEFORME,
          null
        );
        return this.service.select(input.collectiviteId);
      }),
  });
}
